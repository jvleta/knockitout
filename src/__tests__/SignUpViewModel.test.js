import {
  jest,
  describe,
  beforeAll,
  beforeEach,
  test,
  expect,
} from "@jest/globals";

const signInWithPopupMock = jest.fn();
const signOutMock = jest.fn();

const GoogleAuthProviderMock = jest
  .fn()
  .mockImplementation(function GoogleAuthProvider() {});

const authStub = { uid: "uid-123" };

const firebaseModulePath = new URL("../firebase.js", import.meta.url).pathname;

let signInUser;
let signOutUser;
let consoleErrorSpy;

beforeAll(async () => {
  jest.resetModules();
  jest.unstable_mockModule(firebaseModulePath, () => ({
    __esModule: true,
    getFirebase: () => ({ auth: authStub }),
  }));

  jest.unstable_mockModule("firebase/auth", () => ({
    __esModule: true,
    signInWithPopup: signInWithPopupMock,
    signOut: signOutMock,
    GoogleAuthProvider: GoogleAuthProviderMock,
  }));

  ({ signInUser, signOutUser } = await import("../SignUpViewModel.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
  signInWithPopupMock.mockResolvedValue({ user: { uid: "uid-123" } });
  signOutMock.mockResolvedValue();
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("SignUpViewModel", () => {
  test("signInUser invokes signInWithPopup with auth and provider", async () => {
    await expect(signInUser()).resolves.toEqual({ user: { uid: "uid-123" } });

    expect(signInWithPopupMock).toHaveBeenCalledTimes(1);
    const [passedAuth, passedProvider] = signInWithPopupMock.mock.calls[0];
    expect(passedAuth).toBe(authStub);
    expect(passedProvider).toEqual(expect.any(Object));
  });

  test("signInUser rethrows errors from signInWithPopup", async () => {
    const error = new Error("sign-in failed");
    signInWithPopupMock.mockRejectedValueOnce(error);

    await expect(signInUser()).rejects.toThrow(error);
  });

  test("signOutUser calls signOut with auth and propagates success", async () => {
    await expect(signOutUser()).resolves.toBeUndefined();

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledWith(authStub);
  });

  test("signOutUser rethrows errors from signOut", async () => {
    const error = new Error("sign-out failed");
    signOutMock.mockRejectedValueOnce(error);

    await expect(signOutUser()).rejects.toThrow(error);
  });
});
