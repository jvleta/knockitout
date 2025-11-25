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
let buildDueDateToastPayload;

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

  ({ createTodoList, buildDueDateToastPayload } = await import(
    "../ToDoListViewModel.js"
  ));
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

  const createDragEvent = (type, { clientY = 0, relatedTarget = null } = {}) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: {
        effectAllowed: null,
        dropEffect: null,
        setData: jest.fn(),
        getData: jest.fn(),
      },
    });
    Object.defineProperty(event, "clientY", { value: clientY });
    Object.defineProperty(event, "relatedTarget", {
      value: relatedTarget,
    });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    return event;
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

  test("details toggle opens textarea and autosaves on change", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems([{ description: "task", completed: false }], {
      triggerSave: false,
    });

    const toggle = listElement.querySelector(".button--details-toggle");
    const wrapper = listElement.querySelector(".task-details");
    const textarea = listElement.querySelector(".task-details__input");

    expect(wrapper.classList.contains("is-open")).toBe(false);
    expect(toggle.textContent).toBe("Add details");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    toggle.click();

    expect(wrapper.classList.contains("is-open")).toBe(true);
    expect(toggle.textContent).toBe("Hide details");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    textarea.value = "extra context";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);
    expect(todo.getTodoItems()[0].details).toBe("extra context");

    toggle.click();
    expect(wrapper.classList.contains("is-open")).toBe(false);
    expect(toggle.textContent).toBe("Show details");
  });

  test("tasks with existing details render expanded with correct labels", () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems(
      [{ description: "task", details: "already noted", completed: false }],
      { triggerSave: false }
    );

    const toggle = listElement.querySelector(".button--details-toggle");
    const wrapper = listElement.querySelector(".task-details");
    const textarea = listElement.querySelector(".task-details__input");

    expect(wrapper.classList.contains("is-open")).toBe(true);
    expect(toggle.textContent).toBe("Hide details");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(textarea.value).toBe("already noted");

    toggle.click();

    expect(wrapper.classList.contains("is-open")).toBe(false);
    expect(toggle.textContent).toBe("Show details");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
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

  test("dragging a task to a new position updates order and schedules save", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems(
      [
        { description: "task a", completed: false },
        { description: "task b", completed: false },
        { description: "task c", completed: false },
      ],
      { triggerSave: false }
    );

    const items = Array.from(listElement.querySelectorAll("li"));
    items.forEach((li, index) => {
      li.getBoundingClientRect = () => ({
        top: index * 40,
        height: 40,
      });
    });

    const dragHandles = listElement.querySelectorAll(".drag-handle");
    const firstHandle = dragHandles[0];
    const secondItem = items[1];

    firstHandle.dispatchEvent(createDragEvent("dragstart"));
    expect(items[0].classList.contains("dragging")).toBe(true);

    const dragOverEvent = createDragEvent("dragover", { clientY: 65 });
    secondItem.dispatchEvent(dragOverEvent);
    expect(secondItem.classList.contains("dragover-after")).toBe(true);

    secondItem.dispatchEvent(
      createDragEvent("dragleave", { relatedTarget: null })
    );
    expect(secondItem.classList.contains("dragover-after")).toBe(false);

    secondItem.dispatchEvent(createDragEvent("dragover", { clientY: 65 }));
    expect(secondItem.classList.contains("dragover-after")).toBe(true);

    secondItem.dispatchEvent(createDragEvent("drop", { clientY: 65 }));

    expect(secondItem.classList.contains("dragover-after")).toBe(false);
    const refreshedItems = Array.from(
      listElement.querySelectorAll("li")
    );
    expect(
      refreshedItems.some((item) => item.classList.contains("dragging"))
    ).toBe(false);

    firstHandle.dispatchEvent(createDragEvent("dragend"));

    await flushAutosave();
    expect(updateDocMock).toHaveBeenCalledTimes(1);

    const descriptions = todo
      .getTodoItems()
      .map((item) => item.description);
    expect(descriptions).toEqual(["task b", "task a", "task c"]);
  });

  test("dropping a task back on itself keeps order unchanged and skips save", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems(
      [
        { description: "solo task", completed: false },
        { description: "second task", completed: false },
      ],
      { triggerSave: false }
    );

    const items = Array.from(listElement.querySelectorAll("li"));
    items.forEach((li) => {
      li.getBoundingClientRect = () => ({
        top: 0,
        height: 40,
      });
    });

    const firstHandle = listElement.querySelector(".drag-handle");
    firstHandle.dispatchEvent(createDragEvent("dragstart"));

    const firstItem = items[0];
    firstItem.dispatchEvent(createDragEvent("dragover", { clientY: 5 }));
    expect(firstItem.classList.contains("dragover-before")).toBe(false);

    firstItem.dispatchEvent(createDragEvent("drop", { clientY: 5 }));

    await flushAutosave();
    expect(updateDocMock).not.toHaveBeenCalled();

    const descriptions = todo
      .getTodoItems()
      .map((item) => item.description);
    expect(descriptions).toEqual(["solo task", "second task"]);
  });

  test("ignores drag interactions when no item is active", async () => {
    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setUid("user-1");
    todo.setItems(
      [
        { description: "keep me", completed: false },
        { description: "also keep me", completed: false },
      ],
      { triggerSave: false }
    );

    const firstItem = listElement.querySelector("li");
    firstItem.getBoundingClientRect = () => ({
      top: 0,
      height: 40,
    });

    firstItem.dispatchEvent(createDragEvent("dragover", { clientY: 10 }));
    expect(firstItem.classList.contains("dragover-after")).toBe(false);
    expect(firstItem.classList.contains("dragover-before")).toBe(false);

    firstItem.dispatchEvent(createDragEvent("drop", { clientY: 10 }));

    await flushAutosave();
    expect(updateDocMock).not.toHaveBeenCalled();
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

  test("updateItemDueDate refreshes summary badges and emits a toast", () => {
    jest.setSystemTime(new Date("2024-02-10T12:00:00Z"));

    const dueSoonCountElement = document.createElement("span");
    const overdueCountElement = document.createElement("span");
    const chipElement = document.createElement("div");
    const chipTextElement = document.createElement("span");
    const toastContainer = document.createElement("div");

    const todo = createTodoList({
      listElement,
      modalElement,
      imageContainer,
      summaryElements: {
        dueSoonCountElement,
        overdueCountElement,
        chipElement,
        chipTextElement,
      },
      toastContainer,
    });

    todo.setItems([{ description: "file taxes", completed: false }], {
      triggerSave: false,
    });

    todo.updateItemDueDate(0, "2024-02-11");

    expect(todo.getTodoItems()[0].dueDate).toBe("2024-02-11");
    expect(dueSoonCountElement.textContent).toBe("1");
    expect(overdueCountElement.textContent).toBe("0");
    expect(chipElement.classList.contains("due-chip--warning")).toBe(true);
    expect(chipTextElement.textContent).toBe("1 due soon");

    const toast = toastContainer.querySelector(".toast");
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe("file taxes is due tomorrow");
    expect(toast.classList.contains("toast--warning")).toBe(true);
  });

  test("due date input updates item status styles", () => {
    jest.setSystemTime(new Date("2024-02-10T12:00:00Z"));

    const todo = createTodoList({ listElement, modalElement, imageContainer });
    todo.setItems(
      [{ description: "finish report", completed: false, dueDate: "2024-02-15" }],
      { triggerSave: false }
    );

    const item = listElement.querySelector("li");
    const dueInput = item.querySelector(".task-date");
    const pill = item.querySelector(".due-pill");

    expect(item.classList.contains("due-soon")).toBe(false);
    expect(item.classList.contains("overdue")).toBe(false);

    dueInput.value = "2024-02-11";
    dueInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(todo.getTodoItems()[0].dueDate).toBe("2024-02-11");
    expect(item.classList.contains("due-soon")).toBe(true);
    expect(item.classList.contains("overdue")).toBe(false);
    expect(pill.textContent).toBe("Due tomorrow");
    expect(pill.classList.contains("due-pill--warning")).toBe(true);

    dueInput.value = "2024-02-09";
    dueInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(todo.getTodoItems()[0].dueDate).toBe("2024-02-09");
    expect(item.classList.contains("overdue")).toBe(true);
    expect(item.classList.contains("due-soon")).toBe(false);
    expect(pill.textContent).toBe("1 day overdue");
    expect(pill.classList.contains("due-pill--alert")).toBe(true);
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

describe("buildDueDateToastPayload", () => {
  test("returns null for missing or completed items", () => {
    expect(buildDueDateToastPayload(null)).toBeNull();
    expect(
      buildDueDateToastPayload({ description: "done", completed: true })
    ).toBeNull();
  });

  test("returns null for non-urgent statuses", () => {
    expect(
      buildDueDateToastPayload(
        { description: "scheduled", completed: false },
        { type: "scheduled", label: "Later" }
      )
    ).toBeNull();
  });

  test("builds warning payload for upcoming tasks", () => {
    const payload = buildDueDateToastPayload(
      { description: "Call mom", completed: false },
      { type: "due-soon", label: "Due soon" }
    );

    expect(payload).toEqual({
      copy: "Call mom is due soon",
      variant: "warning",
    });
  });

  test("builds danger payload with default title when overdue", () => {
    const payload = buildDueDateToastPayload(
      { description: "   ", completed: false },
      { type: "overdue", label: "Overdue" }
    );

    expect(payload).toEqual({
      copy: "Untitled task is overdue",
      variant: "danger",
    });
  });
});
