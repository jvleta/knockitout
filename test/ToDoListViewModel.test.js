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
  let consoleErrorSpy;

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
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.body.innerHTML = "";
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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

  test("saveTodoItems exits early when no user is signed in", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });

    await todo.saveTodoItems();

    expect(updateDocMock).not.toHaveBeenCalled();
  });

  test("saveTodoItems logs an error when persistence fails", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "error", completed: false }], {
      triggerSave: false,
    });

    const error = new Error("boom");
    updateDocMock.mockRejectedValueOnce(error);

    await todo.saveTodoItems();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error saving todo items",
      error
    );
  });

  test("pending saves are flushed after in-progress save completes", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    let resolveFirstSave;
    updateDocMock
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirstSave = resolve))
      )
      .mockResolvedValueOnce({});

    todo.addTodoItem();
    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);

    todo.saveTodoItems();
    expect(updateDocMock).toHaveBeenCalledTimes(1);

    resolveFirstSave();
    await Promise.resolve();
    await Promise.resolve();

    expect(updateDocMock).toHaveBeenCalledTimes(2);
  });

  test("rapid successive changes reset the autosave timer", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    todo.addTodoItem();
    jest.advanceTimersByTime(400);
    todo.addTodoItem();

    expect(updateDocMock).not.toHaveBeenCalled();

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);
  });

  test("toggleItemCompletion exits early when modal elements are missing", () => {
    const todo = createTodoList({
      listElement,
      modalElement: null,
      imageContainer: null,
    });
    todo.setUid("user-1");
    todo.setItems([{ description: "task", completed: false }], {
      triggerSave: false,
    });

    expect(() => {
      todo.toggleItemCompletion(0, true);
    }).not.toThrow();
  });

  test("setItems safely handles missing list element", () => {
    const todo = createTodoList({
      listElement: null,
      modalElement,
      imageContainer,
    });
    todo.setUid("user-1");

    expect(() => {
      todo.setItems([{ description: "task", completed: false }]);
    }).not.toThrow();
  });

  test("setUid clears pending autosave when user logs out", () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.addTodoItem();

    expect(jest.getTimerCount()).toBeGreaterThan(0);

    todo.setUid("");
    expect(jest.getTimerCount()).toBe(0);
  });

  test("toggleItemCompletion ignores nonexistent indexes", () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    expect(() => {
      todo.toggleItemCompletion(3, true);
    }).not.toThrow();
  });

  test("remove button click removes item and schedules save", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "task", completed: false }], {
      triggerSave: false,
    });

    const removeButton = listElement.querySelector(".button--remove");
    removeButton.click();

    expect(listElement.childElementCount).toBe(0);

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);
  });

  test("checkbox change handler toggles completion", () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "task", completed: false }], {
      triggerSave: false,
    });

    const checkbox = listElement.querySelector(".task-checkbox");
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));

    expect(todo.getTodoItems()[0].completed).toBe(true);
  });

  test("loadTodoItems handles errors gracefully", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    const loadError = new Error("load failed");
    getDocMock.mockRejectedValueOnce(loadError);

    await todo.loadTodoItems();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error loading todo items",
      loadError
    );
    expect(listElement.childElementCount).toBe(0);
  });

  test("loadTodoItems leaves list empty when document is missing", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    await todo.loadTodoItems();

    expect(listElement.childElementCount).toBe(0);
  });

  test("loadTodoItems falls back to empty when document has no data field", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");

    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ data: undefined }),
    });

    await todo.loadTodoItems();

    expect(listElement.childElementCount).toBe(0);
  });

  test("updateItemDescription ignores out-of-range indexes", () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "task", completed: false }], {
      triggerSave: false,
    });

    todo.updateItemDescription(5, "new");

    expect(todo.getTodoItems()[0].description).toBe("task");
    expect(jest.getTimerCount()).toBe(0);
  });

  test("toggling completion to false skips knockout modal", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "task", completed: true }], {
      triggerSave: false,
    });

    todo.toggleItemCompletion(0, false);

    expect(modalElement.classList.contains("open")).toBe(false);

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);
  });
});
