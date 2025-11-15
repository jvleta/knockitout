/**
 * View-model utilities that connect the todo list UI to Firestore,
 * manage autosave, and keep drag-and-drop interactions in sync.
 */

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getFirebase } from "./firebase.js";

import knockout1 from "./images/knockout1.gif";
import knockout2 from "./images/knockout2.gif";
import knockout3 from "./images/knockout3.gif";
import knockout4 from "./images/knockout4.gif";
import knockout5 from "./images/knockout5.gif";
import knockout6 from "./images/knockout6.gif";
import knockout7 from "./images/knockout7.gif";
import knockout8 from "./images/knockout8.gif";
import knockout9 from "./images/knockout9.gif";
import knockout10 from "./images/knockout10.gif";
import knockout11 from "./images/knockout11.gif";
import knockout12 from "./images/knockout12.gif";
import knockout13 from "./images/knockout13.gif";
import knockout14 from "./images/knockout14.gif";
import knockout15 from "./images/knockout15.gif";

/** Array of knockout celebration images used when a task completes. */
const images = [
  knockout1,
  knockout2,
  knockout3,
  knockout4,
  knockout5,
  knockout6,
  knockout7,
  knockout8,
  knockout9,
  knockout10,
  knockout11,
  knockout12,
  knockout13,
  knockout14,
  knockout15,
];

const { db } = getFirebase();

const TODO_DOC_ID = "iGWnr6GGZgrTHiikeC4N";
const AUTOSAVE_DELAY_MS = 800;

/**
 * Create a clean todo item clone to avoid accidental state mutation.
 * @param {{description?: string, details?: string, completed?: boolean, dueDate?: string}} item
 * @returns {{description: string, details: string, completed: boolean, dueDate: string}}
 */
const cloneItem = (item) => ({
  description: item.description || "",
  details: item.details || "",
  completed: Boolean(item.completed),
  dueDate: typeof item.dueDate === "string" ? item.dueDate : "",
});

/** Determine if the provided todo item is past due (ignoring completed tasks). */
const isItemOverdue = (item) => {
  if (!item || item.completed || !item.dueDate) {
    return false;
  }

  const parts = item.dueDate.split("-");
  if (parts.length !== 3) {
    return false;
  }

  const [year, month, day] = parts.map((part) => Number.parseInt(part, 10));
  if ([year, month, day].some((num) => Number.isNaN(num))) {
    return false;
  }

  const dueDate = new Date(year, month - 1, day);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return dueDate.getTime() < today.getTime();
};

/**
 * Factory that wires UI elements to todo list behavior and persistence.
 * @param {{listElement: HTMLElement, modalElement?: HTMLElement, imageContainer?: HTMLElement}} params
 * @returns {{
 *   setUid: (uid: string) => void,
 *   setItems: (items: Array<{description?: string, details?: string, completed?: boolean, dueDate?: string}>, options?: {triggerSave?: boolean}) => void,
 *   addTodoItem: () => void,
 *   removeTodoItem: (index: number) => void,
 *   updateItemDescription: (index: number, description: string) => void,
 *   updateItemDetails: (index: number, details: string) => void,
 *   updateItemDueDate: (index: number, dueDate: string) => void,
 *   toggleItemCompletion: (index: number, isCompleted: boolean) => void,
 *   loadTodoItems: () => Promise<void>,
 *   saveTodoItems: () => Promise<void>,
 *   getTodoItems: () => Array<{description: string, completed: boolean, dueDate: string}>
 * }}
 */
export const createTodoList = ({
  listElement,
  modalElement,
  imageContainer,
}) => {
  /** Internal state that mirrors the rendered todo list. */
  const state = {
    uid: "",
    items: [],
    listElement,
    modalElement,
    imageContainer,
  };

  let saveTimeoutId = null;
  let isSaving = false;
  let pendingSave = false;
  let draggedIndex = null;

  /** Cancel any scheduled autosave to avoid stale data writes. */
  const cancelPendingSave = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
    pendingSave = false;
  };

  /**
   * Push the current todo list to Firestore.
   * Uses merge updates so other document fields remain untouched.
   */
  const persistTodoItems = async () => {
    const docRef = doc(db, "todos", TODO_DOC_ID);

    try {
      await updateDoc(
        docRef,
        {
          data: state.items.map((item) => ({
            completed: item.completed,
            description: item.description,
            details: item.details,
            dueDate: item.dueDate,
          })),
        },
        { merge: true }
      );
      console.log("Document written with ID: ", docRef.id);
    } catch (error) {
      console.error("Error saving todo items", error);
    }
  };

  /** Guarantee that saves run serially to keep Firestore writes ordered. */
  const triggerSave = async () => {
    if (!state.uid) {
      return;
    }

    if (isSaving) {
      pendingSave = true;
      return;
    }

    isSaving = true;
    try {
      await persistTodoItems();
    } finally {
      isSaving = false;
      if (pendingSave) {
        pendingSave = false;
        await triggerSave();
      }
    }
  };

  /**
   * Debounce saving to Firestore by scheduling a write after user input settles.
   */
  const scheduleSave = () => {
    if (!state.uid) {
      return;
    }

    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }

    saveTimeoutId = window.setTimeout(() => {
      saveTimeoutId = null;
      triggerSave();
    }, AUTOSAVE_DELAY_MS);
  };

  /** Display a random celebratory animation in the modal popover. */
  const showKnockoutImage = () => {
    if (!state.modalElement || !state.imageContainer) {
      return;
    }

    const index = Math.floor(Math.random() * images.length);
    const imageFile = images[index];

    state.imageContainer.innerHTML = `<p><img src="${imageFile}" width="500" height="500" /></p>`;
    state.modalElement.classList.add("open");

    setTimeout(() => {
      state.modalElement.classList.remove("open");
    }, 3000);
  };

  /**
   * Reorder a todo item within the list, respecting drag-and-drop bounds.
   * @param {number|null} fromIndex
   * @param {number} toIndex
   */
  const moveTodoItem = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined) {
      return;
    }

    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      fromIndex >= state.items.length
    ) {
      draggedIndex = null;
      return;
    }

    const [movedItem] = state.items.splice(fromIndex, 1);
    if (!movedItem) {
      draggedIndex = null;
      return;
    }

    const boundedIndex = Math.max(
      0,
      Math.min(toIndex, state.items.length)
    );
    state.items.splice(boundedIndex, 0, movedItem);
    draggedIndex = null;
    render();
    scheduleSave();
  };

  /**
   * Render the current todo items into the list element.
   * Keeps drag handles, checkboxes, and inputs synchronized with state.
   */
  const render = () => {
    if (!state.listElement) {
      return;
    }

    state.listElement.innerHTML = "";

    const fragment = document.createDocumentFragment();

    state.items.forEach((item, index) => {
      const li = document.createElement("li");
      li.classList.add("todo-item");
      li.dataset.index = String(index);

      if (item.completed) {
        li.classList.add("completed");
      }
      if (isItemOverdue(item)) {
        li.classList.add("overdue");
      }

      const clearDragIndicators = () => {
        li.classList.remove("dragover-before");
        li.classList.remove("dragover-after");
      };

      const dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = "button button--drag drag-handle";
      dragHandle.setAttribute("draggable", "true");
      dragHandle.title = "Reorder task";
      dragHandle.setAttribute("aria-label", "Reorder task");
      dragHandle.textContent = "::";
      dragHandle.addEventListener("dragstart", (event) => {
        draggedIndex = index;
        li.classList.add("dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", String(index));
        }
      });

      dragHandle.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        draggedIndex = null;
        clearDragIndicators();
      });

      const checkbox = document.createElement("input");
      checkbox.className = "task-checkbox larger";
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.title = "Mark task completed";
      checkbox.addEventListener("change", () => {
        toggleItemCompletion(index, checkbox.checked);
      });

      const input = document.createElement("input");
      input.className = "task-text";
      input.placeholder = "Enter a new task";
      input.value = item.description;
      if (item.completed) {
        input.classList.add("completed-task");
      }
      input.addEventListener("input", (event) => {
        updateItemDescription(index, event.target.value);
      });

      const detailsWrapper = document.createElement("div");
      detailsWrapper.className = "task-details";

      const detailsToggle = document.createElement("button");
      detailsToggle.type = "button";
      detailsToggle.className = "button button--details-toggle";
      detailsToggle.textContent = "Add details";
      detailsToggle.setAttribute("aria-expanded", "false");
      detailsToggle.setAttribute("aria-controls", `details-${index}`);

      const detailsInput = document.createElement("textarea");
      detailsInput.className = "task-details__input";
      detailsInput.placeholder = "Add more detail...";
      detailsInput.value = item.details;
      detailsInput.id = `details-${index}`;
      detailsInput.addEventListener("input", (event) => {
        updateItemDetails(index, event.target.value);
        const isOpen = detailsWrapper.classList.contains("is-open");
        updateDetailsVisibility(isOpen);
      });

      const collapsedLabel = () =>
        detailsInput.value.trim().length ? "Show details" : "Add details";

      const updateDetailsVisibility = (
        shouldShow,
        { shouldFocus = false } = {}
      ) => {
        detailsWrapper.classList.toggle("is-open", shouldShow);
        detailsToggle.setAttribute("aria-expanded", String(shouldShow));
        const collapsedText = collapsedLabel();
        detailsToggle.textContent = shouldShow ? "Hide details" : collapsedText;
        detailsToggle.setAttribute(
          "aria-label",
          shouldShow
            ? "Hide task details"
            : collapsedText === "Show details"
            ? "Show task details"
            : "Add task details"
        );
        if (shouldShow && shouldFocus) {
          detailsInput.focus();
        }
      };

      detailsToggle.addEventListener("click", () => {
        const isOpen = detailsWrapper.classList.contains("is-open");
        updateDetailsVisibility(!isOpen, { shouldFocus: !isOpen });
      });

      detailsWrapper.appendChild(detailsInput);

      const dueDateInput = document.createElement("input");
      dueDateInput.className = "task-date";
      dueDateInput.type = "date";
      dueDateInput.value = item.dueDate || "";
      dueDateInput.title = "Due date";
      dueDateInput.addEventListener("input", (event) => {
        const newValue = event.target.value || "";
        updateItemDueDate(index, newValue);
        li.classList.toggle(
          "overdue",
          Boolean(state.items[index] && isItemOverdue(state.items[index]))
        );
      });

      const removeButton = document.createElement("button");
      removeButton.className = "button button--remove";
      removeButton.textContent = "x";
      removeButton.title = "Remove Item";
      removeButton.addEventListener("click", () => {
        removeTodoItem(index);
      });

      li.addEventListener("dragover", (event) => {
        if (draggedIndex === null) {
          return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "move";
        }

        if (draggedIndex === index) {
          clearDragIndicators();
          return;
        }

        const boundingRect = li.getBoundingClientRect();
        const offset = event.clientY - boundingRect.top;
        const shouldPlaceAfter = offset > boundingRect.height / 2;
        li.classList.toggle("dragover-after", shouldPlaceAfter);
        li.classList.toggle("dragover-before", !shouldPlaceAfter);
      });

      li.addEventListener("dragleave", (event) => {
        if (!li.contains(event.relatedTarget)) {
          clearDragIndicators();
        }
      });

      li.addEventListener("drop", (event) => {
        if (draggedIndex === null) {
          return;
        }

        event.preventDefault();
        const boundingRect = li.getBoundingClientRect();
        const offset = event.clientY - boundingRect.top;
        const shouldPlaceAfter = offset > boundingRect.height / 2;
        let targetIndex = shouldPlaceAfter ? index + 1 : index;

        if (draggedIndex < targetIndex) {
          targetIndex -= 1;
        }

        clearDragIndicators();
        li.classList.remove("dragging");
        moveTodoItem(draggedIndex, targetIndex);
      });

      li.appendChild(dragHandle);
      li.appendChild(checkbox);
      li.appendChild(input);
      const hasDetails = Boolean(item.details);
      updateDetailsVisibility(hasDetails);
      li.appendChild(dueDateInput);
      li.appendChild(detailsToggle);
      li.appendChild(detailsWrapper);
      li.appendChild(removeButton);

      fragment.appendChild(li);
    });

    state.listElement.appendChild(fragment);
  };

  /**
   * Associate the todo list with a signed-in user.
   * Clearing the UID disables autosave operations.
   * @param {string} uid
   */
  const setUid = (uid) => {
    state.uid = uid || "";
    if (!state.uid) {
      cancelPendingSave();
    }
  };

  /**
   * Replace the current todo items and optionally trigger an autosave.
   * @param {Array<{description?: string, details?: string, completed?: boolean, dueDate?: string}>} items
   * @param {{triggerSave?: boolean}} [options]
   */
  const setItems = (items, { triggerSave: shouldTriggerSave = true } = {}) => {
    state.items = items.map(cloneItem);
    render();
    if (shouldTriggerSave) {
      scheduleSave();
    }
  };

  /** Append a blank todo item to the list. */
  const addTodoItem = () => {
    state.items.push({
      description: "",
      details: "",
      completed: false,
      dueDate: "",
    });
    render();
    scheduleSave();
  };

  /**
   * Remove the todo item at the provided index.
   * @param {number} index
   */
  const removeTodoItem = (index) => {
    state.items.splice(index, 1);
    render();
    scheduleSave();
  };

  /**
   * Update the description text for a todo item.
   * @param {number} index
   * @param {string} description
   */
  const updateItemDescription = (index, description) => {
    if (state.items[index]) {
      state.items[index].description = description;
      scheduleSave();
    }
  };

  /**
   * Update the detailed description for a todo item.
   * @param {number} index
   * @param {string} details
   */
  const updateItemDetails = (index, details) => {
    if (state.items[index]) {
      state.items[index].details = details;
      scheduleSave();
    }
  };

  /**
   * Update the due date for a todo item.
   * @param {number} index
   * @param {string} dueDate
   */
  const updateItemDueDate = (index, dueDate) => {
    if (state.items[index]) {
      state.items[index].dueDate = dueDate;
      scheduleSave();
    }
  };

  /**
   * Toggle completion state for an item and optionally play the celebration.
   * @param {number} index
   * @param {boolean} isCompleted
   */
  const toggleItemCompletion = (index, isCompleted) => {
    if (!state.items[index]) {
      return;
    }

    state.items[index].completed = isCompleted;

    if (isCompleted) {
      showKnockoutImage();
    }

    render();
    scheduleSave();
  };

  /**
   * Pull todo items from Firestore and seed the state.
   * Falls back to an empty list if the snapshot or data is missing.
   */
  const loadTodoItems = async () => {
    try {
      const docRef = doc(db, "todos", TODO_DOC_ID);
      const snapshot = await getDoc(docRef);
      const data = snapshot.exists() ? snapshot.data()?.data ?? [] : [];
      setItems(data, { triggerSave: false });
    } catch (error) {
      console.error("Error loading todo items", error);
      setItems([], { triggerSave: false });
    }
  };

  /** Force any pending changes to persist immediately. */
  const saveTodoItems = async () => {
    cancelPendingSave();
    await triggerSave();
  };

  /**
   * Return a serializable snapshot of the current todo list.
   * @returns {Array<{description: string, details: string, completed: boolean, dueDate: string}>}
   */
  const getTodoItems = () =>
    state.items.map((item) => ({
      completed: item.completed,
      description: item.description,
      details: item.details,
      dueDate: item.dueDate,
    }));

  return {
    setUid,
    setItems,
    addTodoItem,
    removeTodoItem,
    updateItemDescription,
    updateItemDetails,
    updateItemDueDate,
    toggleItemCompletion,
    loadTodoItems,
    saveTodoItems,
    getTodoItems,
  };
};
