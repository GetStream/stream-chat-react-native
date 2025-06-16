import { DraftFilters, DraftResponse, DraftSort, Pager, StateStore, StreamChat } from 'stream-chat';
import { WithSubscriptions } from './WithSubscription';

export type QueryDraftOptions = Pager & {
  filter?: DraftFilters;
  sort?: DraftSort;
  user_id?: string;
};

const MAX_QUERY_DRAFTS_LIMIT = 25;

export const DRAFT_MANAGER_INITIAL_STATE = {
  active: false,
  isDraftsOrderStale: false,
  drafts: [],
  pagination: {
    isLoading: false,
    isLoadingNext: false,
    nextCursor: null,
  },
  ready: false,
};

export type DraftManagerState = {
  active: boolean;
  isDraftsOrderStale: boolean;
  pagination: DraftManagerPagination;
  ready: boolean;
  drafts: DraftResponse[];
};

export type DraftManagerPagination = {
  isLoading: boolean;
  isLoadingNext: boolean;
  nextCursor: string | null;
};

export class DraftsManager extends WithSubscriptions {
  public readonly state: StateStore<DraftManagerState>;
  private client: StreamChat;
  private draftsByIdGetterCache: {
    drafts: DraftManagerState['drafts'];
    draftsById: Record<string, DraftResponse | undefined>;
  };

  constructor({ client }: { client: StreamChat }) {
    super();
    this.client = client;
    this.state = new StateStore<DraftManagerState>(DRAFT_MANAGER_INITIAL_STATE);
    this.draftsByIdGetterCache = { drafts: [], draftsById: {} };
  }

  public get draftsById() {
    const { drafts } = this.state.getLatestValue();

    if (drafts === this.draftsByIdGetterCache.drafts) {
      return this.draftsByIdGetterCache.draftsById;
    }

    const draftsById = drafts.reduce<Record<string, DraftResponse>>((newDraftsById, draft) => {
      newDraftsById[draft.message.id] = draft;
      return newDraftsById;
    }, {});

    this.draftsByIdGetterCache.drafts = drafts;
    this.draftsByIdGetterCache.draftsById = draftsById;

    return draftsById;
  }

  public resetState = () => {
    this.state.next(DRAFT_MANAGER_INITIAL_STATE);
  };

  public activate = () => {
    this.state.partialNext({ active: true });
  };

  public deactivate = () => {
    this.state.partialNext({ active: false });
  };

  private subscribeDraftUpdated = () =>
    this.client.on('draft.updated', (event) => {
      if (!event.draft) {
        return;
      }

      const draftData = event.draft;

      const { drafts } = this.state.getLatestValue();

      const newDrafts = [...drafts];

      let existingDraftIndex = -1;

      if (draftData.parent_id) {
        existingDraftIndex = drafts.findIndex(
          (draft) =>
            draft.parent_id === draftData.parent_id &&
            draft.channel?.cid === draftData.channel?.cid,
        );
      } else {
        existingDraftIndex = drafts.findIndex(
          (draft) => draft.channel?.cid === draftData.channel?.cid,
        );
      }

      if (existingDraftIndex !== -1) {
        newDrafts[existingDraftIndex] = draftData;
      } else {
        newDrafts.push(draftData);
      }

      this.state.partialNext({ drafts: newDrafts });
    }).unsubscribe;

  private subscribeDraftDeleted = () =>
    this.client.on('draft.deleted', (event) => {
      if (!event.draft) {
        return;
      }

      const { drafts } = this.state.getLatestValue();

      const newDrafts = [...drafts];

      const draftData = event.draft;

      let existingDraftIndex = -1;

      if (draftData.parent_id) {
        existingDraftIndex = drafts.findIndex(
          (draft) =>
            draft.parent_id === draftData.parent_id &&
            draft.channel_cid === draftData.channel_cid,
        );
      } else {
        existingDraftIndex = drafts.findIndex(
          (draft) => draft.channel_cid === draftData.channel_cid,
        );
      }

      if (existingDraftIndex !== -1) {
        newDrafts.splice(existingDraftIndex, 1);
      }

      this.state.partialNext({
        drafts: newDrafts,
      });
    }).unsubscribe;

  private subscribeReloadOnActivation = () =>
    this.state.subscribeWithSelector(
      (nextValue) => ({ active: nextValue.active }),
      ({ active }) => {
        if (active) {
          this.reload();
        }
      },
    );

  public registerSubscriptions = () => {
    if (this.hasSubscriptions) {
      return;
    }
    this.addUnsubscribeFunction(this.subscribeReloadOnActivation());
    this.addUnsubscribeFunction(this.subscribeDraftUpdated());
    this.addUnsubscribeFunction(this.subscribeDraftDeleted());
  };

  public unregisterSubscriptions = () => {
    return super.unregisterSubscriptions();
  };

  public reload = async ({ force = false } = {}) => {
    const { drafts, isDraftsOrderStale, pagination, ready } = this.state.getLatestValue();
    if (pagination.isLoading) {
      return;
    }
    if (!force && ready && !isDraftsOrderStale) {
      return;
    }
    const limit = drafts.length;

    try {
      this.state.next((current) => ({
        ...current,
        pagination: {
          ...current.pagination,
          isLoading: true,
        },
      }));

      const response = await this.queryDrafts({
        limit: Math.min(limit, MAX_QUERY_DRAFTS_LIMIT) || MAX_QUERY_DRAFTS_LIMIT,
      });

      const nextDrafts: DraftResponse[] = [];

      for (const incomingDraft of response.drafts) {
        const existingDraft = this.draftsById[incomingDraft.message.id];

        if (existingDraft) {
          // Reuse draft instances if possible
          nextDrafts.push(existingDraft);
        } else {
          nextDrafts.push(incomingDraft);
        }
      }

      this.state.next((current) => ({
        ...current,
        drafts: nextDrafts,
        unseenDraftIds: [],
        isDraftOrderStale: false,
        pagination: {
          ...current.pagination,
          isLoading: false,
          nextCursor: response.next ?? null,
        },
        ready: true,
      }));
    } catch (error) {
      this.client.logger('error', (error as Error).message);
      this.state.next((current) => ({
        ...current,
        pagination: {
          ...current.pagination,
          isLoading: false,
        },
      }));
    }
  };

  public queryDrafts = async (options: QueryDraftOptions = {}) => {
    const response = await this.client.queryDrafts({
      limit: MAX_QUERY_DRAFTS_LIMIT,
      ...options,
    });
    return response;
  };

  public loadNextPage = async (options: QueryDraftOptions = {}) => {
    const { pagination } = this.state.getLatestValue();

    if (pagination.isLoadingNext || !pagination.nextCursor) {
      return;
    }

    try {
      this.state.partialNext({ pagination: { ...pagination, isLoadingNext: true } });

      const response = await this.queryDrafts({
        ...options,
        next: pagination.nextCursor,
      });

      this.state.next((current) => ({
        ...current,
        drafts: response.drafts.length ? current.drafts.concat(response.drafts) : current.drafts,
        pagination: {
          ...current.pagination,
          nextCursor: response.next ?? null,
          isLoadingNext: false,
        },
      }));
    } catch (error) {
      this.client.logger('error', (error as Error).message);
      this.state.next((current) => ({
        ...current,
        pagination: {
          ...current.pagination,
          isLoadingNext: false,
        },
      }));
    }
  };
}
