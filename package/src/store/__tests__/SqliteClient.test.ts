import { sqliteMock } from '../../mock-builders/DB/mock';
import { SqliteClient, SqliteClientError } from '../SqliteClient';

// Captured before any spy is installed so the spy can call through to a real
// better-sqlite3 handle while still observing the arguments open() was given.
const openDatabase = sqliteMock.open;

/** Runs `initializeDatabase` once and returns the error it threw. */
const captureInitError = async () => {
  try {
    await SqliteClient.initializeDatabase();
  } catch (error) {
    return error as SqliteClientError;
  }
  throw new Error('expected initializeDatabase to reject, but it resolved');
};

describe('SqliteClient encryption', () => {
  let openSpy: jest.SpyInstance<ReturnType<typeof sqliteMock.open>>;
  let deleteMocks: jest.Mock[];

  beforeEach(() => {
    SqliteClient.getEncryptionKey = undefined;
    SqliteClient.db = undefined;
    SqliteClient.logger = jest.fn();

    deleteMocks = [];
    openSpy = jest.spyOn(sqliteMock, 'open').mockImplementation(() => {
      const db = openDatabase();
      const originalDelete = db.delete;
      const deleteMock = jest.fn(() => originalDelete());
      deleteMocks.push(deleteMock);
      return { ...db, delete: deleteMock };
    });

    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    SqliteClient.getEncryptionKey = undefined;
    SqliteClient.logger = undefined;
    SqliteClient.db = undefined;
  });

  describe('opening without encryption', () => {
    it('does not pass an encryption key when no getter is configured', async () => {
      await expect(SqliteClient.initializeDatabase()).resolves.toBe(true);

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy.mock.calls[0][0]).not.toHaveProperty('encryptionKey');
    });

    it('never consults isSQLCipher when no getter is configured', async () => {
      const isSQLCipherSpy = jest.spyOn(sqliteMock, 'isSQLCipher');

      await SqliteClient.initializeDatabase();

      expect(isSQLCipherSpy).not.toHaveBeenCalled();
    });
  });

  describe('opening with encryption', () => {
    it('passes the resolved key to open()', async () => {
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');

      await expect(SqliteClient.initializeDatabase()).resolves.toBe(true);

      expect(SqliteClient.getEncryptionKey).toHaveBeenCalledTimes(1);
      expect(openSpy.mock.calls[0][0]).toMatchObject({ encryptionKey: 'a-stable-key' });
    });

    it('refuses to open at all when op-sqlite has no SQLCipher build', async () => {
      jest.spyOn(sqliteMock, 'isSQLCipher').mockReturnValue(false);
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');

      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);

      expect(error.code).toBe('SQLCIPHER_BUILD_MISSING');
      // The whole point: no database is created, so nothing is written in plaintext.
      expect(openSpy).not.toHaveBeenCalled();
      // Nor is the key ever requested - the build is unusable regardless of it.
      expect(SqliteClient.getEncryptionKey).not.toHaveBeenCalled();
      expect(deleteMocks).toHaveLength(0);
    });

    it('refuses to open when isSQLCipher is missing from the installed op-sqlite', async () => {
      // An op-sqlite too old to expose the check cannot be verified, so it is
      // treated exactly like a build without SQLCipher.
      const { isSQLCipher } = sqliteMock;
      // @ts-expect-error deliberately simulating an older op-sqlite
      delete sqliteMock.isSQLCipher;
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');

      try {
        const error = await captureInitError();

        expect(error).toBeInstanceOf(SqliteClientError);
        expect(error.code).toBe('SQLCIPHER_BUILD_MISSING');
        expect(openSpy).not.toHaveBeenCalled();
      } finally {
        sqliteMock.isSQLCipher = isSQLCipher;
      }
    });
  });

  describe('when the encryption key cannot be obtained', () => {
    it('gives up without wiping when the getter throws', async () => {
      const cause = new Error('keychain is locked');
      SqliteClient.getEncryptionKey = jest.fn().mockRejectedValue(cause);

      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);

      expect(error.code).toBe('ENCRYPTION_KEY_UNAVAILABLE');
      expect(error.cause).toBe(cause);
      expect(openSpy).not.toHaveBeenCalled();
      // Not being handed a key says nothing about the database on disk, so it stays.
      expect(deleteMocks).toHaveLength(0);
    });

    it('gives up without wiping when the getter resolves without a key', async () => {
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue(undefined);

      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);

      expect(error.code).toBe('ENCRYPTION_KEY_UNAVAILABLE');
      expect(openSpy).not.toHaveBeenCalled();
      expect(deleteMocks).toHaveLength(0);
    });

    it('treats an empty string as no key', async () => {
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('');

      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);

      expect(error.code).toBe('ENCRYPTION_KEY_UNAVAILABLE');
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('clears a recorded encryption error once initialization succeeds', async () => {
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue(undefined);
      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);
      expect(error).toBeDefined();

      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');
      await expect(SqliteClient.initializeDatabase()).resolves.toBe(true);
    });
  });

  describe('when the database cannot be read', () => {
    const notADatabase = () =>
      new Error('Querying for user_version failed: Error: file is not a database');

    it('throws OFFLINE_DB_UNREADABLE instead of wiping it', async () => {
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');
      jest.spyOn(SqliteClient, 'getUserPragmaVersion').mockRejectedValue(notADatabase());

      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);

      expect(error.code).toBe('OFFLINE_DB_UNREADABLE');
      // Deleting it is the caller's decision - the pending-task queue lives in there.
      expect(deleteMocks.every((m) => m.mock.calls.length === 0)).toBe(true);
    });

    it('keeps the original cause on the thrown error', async () => {
      const cause = notADatabase();
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');
      jest.spyOn(SqliteClient, 'getUserPragmaVersion').mockRejectedValue(cause);

      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);

      expect(error.cause).toBe(cause);
    });

    it('throws even with no encryption configured', async () => {
      // Turning encryption off leaves an encrypted file and no key to read it. Simply
      // reporting failure would leave offline support uninitialized forever, so the
      // caller is told and can delete it.
      jest.spyOn(SqliteClient, 'getUserPragmaVersion').mockRejectedValue(notADatabase());

      const error = await captureInitError();

      expect(error).toBeInstanceOf(SqliteClientError);

      expect(error.code).toBe('OFFLINE_DB_UNREADABLE');
    });

    it('does not throw on a transient failure', async () => {
      SqliteClient.getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');
      jest
        .spyOn(SqliteClient, 'getUserPragmaVersion')
        .mockRejectedValue(new Error('Query failed: Error: database is locked'));

      await expect(SqliteClient.initializeDatabase()).resolves.toBe(false);
    });
  });

  describe('isUnreadableDbError', () => {
    it.each([
      'file is not a database',
      'SQLite error code: 26',
      'SQLite code:11',
      'NOTADB',
      'SQLITE_CORRUPT',
      'database disk image is malformed',
      'file is encrypted or is not a database',
    ])('treats %p as unreadable', (message) => {
      expect(SqliteClient.isUnreadableDbError(new Error(message))).toBe(true);
    });

    it.each([
      'database is locked',
      'SQLITE_BUSY',
      'SQLITE_LOCKED',
      'disk I/O error',
      'SQLITE_IOERR',
      'unable to open database file',
      'SQLITE_CANTOPEN',
      'out of memory',
      'attempt to write a readonly database',
      'DB is not open or initialized.',
      'Please install "@op-engineering/op-sqlite" package to enable offline support',
    ])('does not treat %p as unreadable', (message) => {
      expect(SqliteClient.isUnreadableDbError(new Error(message))).toBe(false);
    });

    it('lets a transient reason win when both are present in one message', () => {
      // Pins the precedence rule: a message that could be read either way must not
      // trigger a wipe. Guessing wrong in this direction destroys a good database.
      expect(
        SqliteClient.isUnreadableDbError(
          new Error('unable to open database file: file is not a database'),
        ),
      ).toBe(false);
    });

    it('handles non-Error throwables', () => {
      expect(SqliteClient.isUnreadableDbError('file is not a database')).toBe(true);
      expect(SqliteClient.isUnreadableDbError(undefined)).toBe(false);
    });
  });
});
