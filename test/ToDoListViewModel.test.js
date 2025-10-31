import {
  jest,
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  test,
  expect,
} from "@jest/globals";

const docMock = jest.fn((db, collection, id) => ({ db, collection, id }));
const updateDocMock = jest.fn(async () => {});
const getDocMock = jest.fn();

let createTodoList;

const firebaseModulePath = new URL("../firebase.js", import.meta.url).pathname;

beforeAll(async () => {
  jest.unstable_mockModule(firebaseModulePath, () => ({
    getFirebase: () => ({ db: {} }),
  }));

  jest.unstable_mockModule("firebase/firestore", () => ({
    doc: docMock,
    updateDoc: updateDocMock,
    getDoc: getDocMock,
  }));

  ({ createTodoList } = await import("../ToDoListViewModel.js"));
});

describe("createTodoList", () => {
  let listElement;
  let modalElement;
  let imageContainer;
  let consoleLogSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    document.body.innerHTML = `
      <ul id="todo-list"></ul>
      <div id="modal-one" class="modal"></div>
      <div id="knockouts"></div>
    `;

    listElement = document.getElementById("todo-list");
    modalElement = document.getElementById("modal-one");
    imageContainer = document.getElementById("knockouts");

    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => ({ data: [] }),
    });

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = "";
    consoleLogSpy.mockRestore();
  });

  const flushAutosave = async (delay = 800) => {
    jest.advanceTimersByTime(delay);
    await Promise.resolve();
  };

  test("setItems renders tasks without scheduling a save when requested", () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    todo.setItems(
      [
        { description: "first task", completed: false },
        { description: "done task", completed: true },
      ],
      { triggerSave: false }
    );

    const items = Array.from(listElement.querySelectorAll("li"));
    expect(items).toHaveLength(2);
    expect(items[0].querySelector(".task-text").value).toBe("first task");
    expect(items[1].classList.contains("completed")).toBe(true);
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  test("addTodoItem schedules an autosave when a user is signed in", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    todo.addTodoItem();

    expect(listElement.childElementCount).toBe(1);
    expect(updateDocMock).not.toHaveBeenCalled();

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);
  });

  test("addTodoItem does not autosave when there is no signed-in user", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });

    todo.addTodoItem();

    expect(listElement.childElementCount).toBe(1);

    await flushAutosave();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  test("typing in a task input updates state and triggers autosave", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "", completed: false }], {
      triggerSave: false,
    });

    const input = listElement.querySelector("input.task-text");
    input.value = "updated todo";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await flushAutosave();

    expect(updateDocMock).toHaveBeenCalledTimes(1);
    expect(todo.getTodoItems()[0].description).toBe("updated todo");
  });

  test("toggleItemCompletion marks item, shows modal, and auto-saves", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "task", completed: false }], {
      triggerSave: false,
    });

    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    todo.toggleItemCompletion(0, true);

    const item = listElement.querySelector("li");
    expect(item.classList.contains("completed")).toBe(true);
    expect(modalElement.classList.contains("open")).toBe(true);
    expect(imageContainer.innerHTML).toContain("<img");

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(3000);
    expect(modalElement.classList.contains("open")).toBe(false);

    randomSpy.mockRestore();
  });

  test("loadTodoItems populates list from Firestore without triggering autosave", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        data: [{ description: "from cloud", completed: true }],
      }),
    });

    await todo.loadTodoItems();

    expect(listElement.childElementCount).toBe(1);
    const item = listElement.querySelector("li");
    expect(item.classList.contains("completed")).toBe(true);
    expect(item.querySelector(".task-text").value).toBe("from cloud");

    await flushAutosave();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  test("saveTodoItems flushes any pending autosave immediately", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    todo.addTodoItem();
    expect(updateDocMock).not.toHaveBeenCalled();

    await todo.saveTodoItems();
    expect(updateDocMock).toHaveBeenCalledTimes(1);

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);
  });
});
