import { defineComponent, h } from "vue";

export const Button = defineComponent({
  name: "Button",
  props: {
    variant: {
      type: String,
      default: "default",
    },
    size: {
      type: String,
      default: "default",
    },
    type: {
      type: String,
      default: "button",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    class: {
      type: String,
      default: "",
    },
  },
  setup(props, { slots, attrs }) {
    const getVariantClasses = () => {
      switch (props.variant) {
        case "default":
          return "bg-primary text-white border-black";
        case "outline":
          return "border-black bg-white text-black hover:bg-gray-100";
        case "secondary":
          return "bg-secondary text-black border-black";
        case "accent":
          return "bg-accent text-black border-black";
        case "ghost":
          return "bg-transparent hover:bg-gray-100 text-black border-transparent";
        case "link":
          return "bg-transparent underline text-primary hover:text-primary-dark border-transparent shadow-none";
        default:
          return "bg-primary text-white border-black";
      }
    };

    const getSizeClasses = () => {
      switch (props.size) {
        case "default":
          return "h-12 px-5 py-3 text-base";
        case "sm":
          return "h-9 px-3 py-2 text-sm";
        case "lg":
          return "h-14 px-8 py-4 text-lg";
        default:
          return "h-12 px-5 py-3 text-base";
      }
    };

    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-bold border-[3px] transition-all duration-200 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

    return () =>
      h(
        "button",
        {
          type: props.type,
          disabled: props.disabled,
          class: `${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${
            props.class
          }`,
          ...attrs,
        },
        slots.default?.()
      );
  },
});
