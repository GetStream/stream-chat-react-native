import {
  type AIClientTool,
  AIClientToolRunner,
  type AIClientToolSend,
  type AIMessagePartData,
  completedToolResult,
  failedToolResult,
  parseMessagePart,
} from '../index';

const step = (fields: Record<string, unknown>) =>
  parseMessagePart({
    executor: 'client',
    id: 'toolu_01A',
    name: 'athena_device_location',
    status: 'awaiting_client',
    target_client_id: 'ios-1',
    target_user_id: 'u_1',
    type: 'ai_tool_call',
    ...fields,
  }) as AIMessagePartData;

const awaiting = ({
  client = 'ios-1',
  id = 'toolu_01A',
  name = 'athena_device_location',
  user = 'u_1',
} = {}) => [step({ id, name, target_client_id: client, target_user_id: user })];

const countingTool = () => {
  const tool = {
    definition: { name: 'athena_device_location' },
    run: jest.fn(() => completedToolResult({ city: 'Skopje' }, 'Shared approximate location')),
  } satisfies AIClientTool;
  return tool;
};

const settle = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

const runnerWith = (tools: AIClientTool[], maxAttempts?: number) =>
  new AIClientToolRunner({ clientId: 'ios-1', maxAttempts, tools, userId: 'u_1' });

describe('AIClientToolRunner', () => {
  it('runs a call once, and only on the device it is addressed to', async () => {
    const tool = countingTool();
    const runner = runnerWith([tool]);
    const send = jest.fn<ReturnType<AIClientToolSend>, Parameters<AIClientToolSend>>(() =>
      Promise.resolve(),
    );

    runner.run(awaiting(), send);
    runner.run(awaiting(), send);
    await settle();
    runner.run(awaiting(), send);
    runner.run(awaiting({ client: 'ios-2', id: 'toolu_02' }), send);
    runner.run(awaiting({ id: 'toolu_03', user: 'u_2' }), send);
    runner.run(awaiting({ id: 'toolu_04', name: 'unknown_tool' }), send);
    await settle();

    expect(tool.run).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].id).toBe('toolu_01A');
    expect(send.mock.calls[0][1]).toEqual({
      output: { city: 'Skopje' },
      summary: 'Shared approximate location',
    });
  });

  it('sends a result that could not be sent again, without running the tool again', async () => {
    const tool = countingTool();
    const runner = runnerWith([tool]);
    let attempts = 0;
    const send = () => {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error('offline')) : Promise.resolve();
    };

    for (let i = 0; i < 3; i += 1) {
      runner.run(awaiting(), send);
      await settle();
    }

    expect(tool.run).toHaveBeenCalledTimes(1);
    expect(attempts).toBe(2);
  });

  it('gives up on a result after its attempts', async () => {
    const tool = countingTool();
    const runner = runnerWith([tool], 2);
    const send = jest.fn(() => Promise.reject(new Error('offline')));

    for (let i = 0; i < 4; i += 1) {
      runner.run(awaiting(), send);
      await settle();
    }

    expect(tool.run).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not run a call again while it is still running', async () => {
    let finish: () => void = () => undefined;
    const tool: AIClientTool = {
      definition: { name: 'athena_device_location' },
      run: jest.fn(
        () =>
          new Promise((resolve) => {
            finish = () => resolve(completedToolResult({ city: 'Skopje' }));
          }),
      ),
    };
    const runner = runnerWith([tool]);
    const send = jest.fn(() => Promise.resolve());

    runner.run(awaiting(), send);
    await settle();
    runner.run(awaiting(), send);
    finish();
    await settle();

    expect(tool.run).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does not run a call that is finished', async () => {
    const tool = countingTool();
    const runner = runnerWith([tool]);

    runner.run([step({ status: 'completed' })], jest.fn());
    await settle();

    expect(tool.run).not.toHaveBeenCalled();
  });

  it('reports a tool that throws as failed', async () => {
    const tool: AIClientTool = {
      definition: { name: 'athena_device_location' },
      run: () => Promise.reject(new Error('no GPS')),
    };
    const send = jest.fn(() => Promise.resolve());

    runnerWith([tool]).run(awaiting(), send);
    await settle();

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ id: 'toolu_01A' }), {
      failure: "The tool couldn't run",
    });
  });

  it('sorts its tool names and keeps the first tool of a name', async () => {
    const named = (name: string) =>
      ({
        definition: { name },
        run: jest.fn(() => failedToolResult('Not now')),
      }) satisfies AIClientTool;
    const first = named('athena_device_location');
    const duplicate = named('athena_device_location');
    const runner = runnerWith([named('open_camera'), first, duplicate]);

    runner.run(awaiting(), () => Promise.resolve());
    await settle();

    expect(runner.toolNames).toEqual(['athena_device_location', 'open_camera']);
    expect(first.run).toHaveBeenCalledTimes(1);
    expect(duplicate.run).not.toHaveBeenCalled();
  });

  it('describes every tool to the agent', () => {
    const weather: AIClientTool = {
      definition: {
        description: 'Gets the weather for a city.',
        inputSchema: {
          properties: { city: { type: 'string' } },
          required: ['city'],
          type: 'object',
        },
        name: 'get_weather',
      },
      instructions: 'Use it when the person asks about the weather.',
      run: () => failedToolResult('Not now'),
      showExternalSourcesIndicator: true,
    };
    const runner = runnerWith([weather, countingTool()]);

    expect(runner.registrations).toEqual([
      // A tool without a description or instructions.
      { description: '', name: 'athena_device_location', showExternalSourcesIndicator: false },
      {
        description: 'Gets the weather for a city.',
        instructions: 'Use it when the person asks about the weather.',
        name: 'get_weather',
        parameters: {
          properties: { city: { type: 'string' } },
          required: ['city'],
          type: 'object',
        },
        showExternalSourcesIndicator: true,
      },
    ]);
  });

  it('describes a tool without a description by its instructions', () => {
    const location: AIClientTool = {
      definition: { name: 'get_location' },
      instructions: 'Ask before sharing the location.',
      run: () => failedToolResult('Not now'),
    };

    expect(runnerWith([location]).registrations[0].description).toBe(
      'Ask before sharing the location.',
    );
  });
});
