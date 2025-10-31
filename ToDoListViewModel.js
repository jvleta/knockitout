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

const cloneItem = (item) => ({
  description: item.description || "",
  completed: Boolean(item.completed),
});

export const createTodoList = ({
  listElement,
  modalElement,
  imageContainer,
}) => {
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

  const cancelPendingSave = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
    pendingSave = false;
  };

  const persistTodoItems = async () => {
    const docRef = doc(db, "todos", TODO_DOC_ID);

    try {
      await updateDoc(
        docRef,
        {
          data: state.items.map((item) => ({
            completed: item.completed,
            description: item.description,
          })),
        },
        { merge: true }
      );
      console.log("Document written with ID: ", docRef.id);
    } catch (error) {
      console.error("Error saving todo items", error);
    }
  };

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
      li.appendChild(removeButton);

      fragment.appendChild(li);
    });

    state.listElement.appendChild(fragment);
  };

  const setUid = (uid) => {
    state.uid = uid || "";
    if (!state.uid) {
      cancelPendingSave();
    }
  };

  const setItems = (items, { triggerSave: shouldTriggerSave = true } = {}) => {
    state.items = items.map(cloneItem);
    render();
    if (shouldTriggerSave) {
      scheduleSave();
    }
  };

  const addTodoItem = () => {
    state.items.push({ description: "", completed: false });
    render();
    scheduleSave();
  };

  const removeTodoItem = (index) => {
    state.items.splice(index, 1);
    render();
    scheduleSave();
  };

  const updateItemDescription = (index, description) => {
    if (state.items[index]) {
      state.items[index].description = description;
      scheduleSave();
    }
  };

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

  const saveTodoItems = async () => {
    cancelPendingSave();
    await triggerSave();
  };

  const getTodoItems = () =>
    state.items.map((item) => ({
      completed: item.completed,
      description: item.description,
    }));

  return {
    setUid,
    setItems,
    addTodoItem,
    removeTodoItem,
    updateItemDescription,
    toggleItemCompletion,
    loadTodoItems,
    saveTodoItems,
    getTodoItems,
  };
};
