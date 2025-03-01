import {
  defineComponent,
  h,
  ref,
  computed,
  onMounted,
  onUnmounted,
  Transition,
} from "vue";

// Drawer component
export const Drawer = defineComponent({
  name: "Drawer",
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    onOpenChange: {
      type: Function,
      default: () => {},
    },
  },
  setup(props, { slots }) {
    const isOpen = ref(props.open);

    const handleOpenChange = (value: boolean) => {
      isOpen.value = value;
      props.onOpenChange(value);
    };

    return () =>
      h(
        "div",
        { class: "drawer-root" },
        slots.default?.({
          open: isOpen.value,
          onOpenChange: handleOpenChange,
        })
      );
  },
});

// DrawerTrigger component
export const DrawerTrigger = defineComponent({
  name: "DrawerTrigger",
  setup(_, { slots }) {
    return () =>
      h(
        "div",
        {
          class: "drawer-trigger cursor-pointer",
          onClick: () => {
            const event = new CustomEvent("drawer:open");
            window.dispatchEvent(event);
          },
        },
        slots.default?.()
      );
  },
});

// DrawerContent component
export const DrawerContent = defineComponent({
  name: "DrawerContent",
  props: {
    class: {
      type: String,
      default: "",
    },
  },
  setup(props, { slots }) {
    const isOpen = ref(false);
    const isDragging = ref(false);
    const startY = ref(0);
    const currentY = ref(0);

    const handleOpen = () => {
      isOpen.value = true;
      document.body.classList.add("overflow-hidden");
    };

    const handleClose = () => {
      isOpen.value = false;
      document.body.classList.remove("overflow-hidden");
    };

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
      isDragging.value = true;
      startY.value = "touches" in e ? e.touches[0].clientY : e.clientY;
      currentY.value = startY.value;

      // Add event listeners for drag and end
      if ("ontouchstart" in window) {
        window.addEventListener("touchmove", handleDragMove, {
          passive: false,
        });
        window.addEventListener("touchend", handleDragEnd);
      } else {
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
      }
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.value) return;

      // Prevent default to stop scrolling
      e.preventDefault();

      currentY.value = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dragDistance = currentY.value - startY.value;

      // If dragged down more than 100px, close the drawer
      if (dragDistance > 100) {
        handleDragEnd();
        handleClose();
      }
    };

    const handleDragEnd = () => {
      isDragging.value = false;

      // Remove event listeners
      if ("ontouchstart" in window) {
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      } else {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      }
    };

    onMounted(() => {
      window.addEventListener("drawer:open", handleOpen);
      window.addEventListener("drawer:close", handleClose);
    });

    onUnmounted(() => {
      window.removeEventListener("drawer:open", handleOpen);
      window.removeEventListener("drawer:close", handleClose);

      // Clean up drag listeners if needed
      if ("ontouchstart" in window) {
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      } else {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      }
    });

    return () =>
      h("div", {}, [
        // Overlay with transition
        h(
          Transition,
          {
            name: "fade",
            enterActiveClass: "transition-opacity duration-300 ease-in-out",
            enterFromClass: "opacity-0",
            enterToClass: "opacity-100",
            leaveActiveClass: "transition-opacity duration-200 ease-in-out",
            leaveFromClass: "opacity-100",
            leaveToClass: "opacity-0",
          },
          {
            default: () =>
              isOpen.value
                ? h("div", {
                    class: "fixed inset-0 z-50 bg-black/80",
                    onClick: handleClose,
                  })
                : null,
          }
        ),

        // Content with transition
        h(
          Transition,
          {
            name: "slide-up",
            enterActiveClass: "transition-transform duration-300 ease-out",
            enterFromClass: "translate-y-full",
            enterToClass: "translate-y-0",
            leaveActiveClass: "transition-transform duration-200 ease-in",
            leaveFromClass: "translate-y-0",
            leaveToClass: "translate-y-full",
          },
          {
            default: () =>
              isOpen.value
                ? h(
                    "div",
                    {
                      class: `fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-lg border-[3px] border-black bg-white shadow-[0px_-5px_0px_0px_rgba(0,0,0,1)] ${props.class}`,
                    },
                    [
                      // Interactive handle
                      h("div", {
                        class:
                          "mx-auto mt-4 h-3 w-[100px] rounded-full bg-black cursor-grab active:cursor-grabbing hover:bg-gray-800 transition-colors",
                        onMousedown: handleDragStart,
                        onTouchstart: handleDragStart,
                      }),
                      slots.default?.(),
                    ]
                  )
                : null,
          }
        ),
      ]);
  },
});

// DrawerClose component
export const DrawerClose = defineComponent({
  name: "DrawerClose",
  setup(_, { slots }) {
    const handleClose = () => {
      const event = new CustomEvent("drawer:close");
      window.dispatchEvent(event);
    };

    return () =>
      h(
        "div",
        {
          class: "drawer-close cursor-pointer",
          onClick: handleClose,
        },
        slots.default?.()
      );
  },
});

// DrawerHeader component
export const DrawerHeader = defineComponent({
  name: "DrawerHeader",
  props: {
    class: {
      type: String,
      default: "",
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: `grid gap-1.5 p-6 text-center sm:text-left border-b-[3px] border-black ${props.class}`,
        },
        slots.default?.()
      );
  },
});

// DrawerFooter component
export const DrawerFooter = defineComponent({
  name: "DrawerFooter",
  props: {
    class: {
      type: String,
      default: "",
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          class: `mt-auto flex flex-col gap-3 p-6 border-t-[3px] border-black ${props.class}`,
        },
        slots.default?.()
      );
  },
});

// DrawerTitle component
export const DrawerTitle = defineComponent({
  name: "DrawerTitle",
  props: {
    class: {
      type: String,
      default: "",
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "h2",
        {
          class: `text-2xl font-bold leading-none tracking-tight ${props.class}`,
        },
        slots.default?.()
      );
  },
});

// DrawerDescription component
export const DrawerDescription = defineComponent({
  name: "DrawerDescription",
  props: {
    class: {
      type: String,
      default: "",
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "p",
        {
          class: `text-base mt-2 ${props.class}`,
        },
        slots.default?.()
      );
  },
});
