import { defineComponent, h, ref, onMounted, computed } from "vue";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
} from "../../ui/drawer";
import { Button } from "../../ui/button";

export const AuthDrawer = defineComponent({
  name: "AuthDrawer",
  props: {
    type: {
      type: String,
      default: "login",
      validator: (value: string) => ["login", "register"].includes(value),
    },
    returnUrl: {
      type: String,
      default: "/",
    },
    triggerClass: {
      type: String,
      default: "",
    },
    triggerText: {
      type: String,
      default: "Sign In",
    },
  },
  setup(props) {
    const iframeLoaded = ref(false);
    const iframeHeight = computed(() =>
      props.type === "login" ? "500px" : "600px"
    );

    const handleAuthSuccess = (event: MessageEvent) => {
      const authServiceUrl = import.meta.env.PUBLIC_AUTH_SERVICE_URL;
      const authInterfaceUrl = import.meta.env.PUBLIC_AUTH_INTERFACE_URL;

      if (
        event.origin !== authServiceUrl &&
        event.origin !== authInterfaceUrl
      ) {
        return;
      }

      if (event.data.type === "AUTH_SUCCESS") {
        localStorage.setItem("synkro_user", JSON.stringify(event.data.user));
        localStorage.setItem("synkro_token", event.data.access_token);

        const closeEvent = new CustomEvent("drawer:close");
        window.dispatchEvent(closeEvent);

        window.location.reload();
      }
    };

    const checkAuthStatus = () => {
      return localStorage.getItem("synkro_token") !== null;
    };

    onMounted(() => {
      window.addEventListener("message", handleAuthSuccess);

      return () => {
        window.removeEventListener("message", handleAuthSuccess);
      };
    });

    const iframeUrl = () => {
      const baseUrl = import.meta.env.PUBLIC_AUTH_INTERFACE_URL;
      const path = props.type === "login" ? "/login" : "/register";
      return `${baseUrl}${path}?returnUrl=${encodeURIComponent(
        props.returnUrl
      )}&theme=neobrutal`;
    };

    return () => {
      if (checkAuthStatus()) {
        return null;
      }

      return h(
        Drawer,
        {},
        {
          default: () => [
            h(
              DrawerTrigger,
              {},
              {
                default: () =>
                  h(
                    Button,
                    {
                      variant: props.type === "login" ? "outline" : "primary",
                      class: props.triggerClass,
                    },
                    {
                      default: () => props.triggerText,
                    }
                  ),
              }
            ),
            h(
              DrawerContent,
              { class: "max-h-[90vh] w-full min-h-[60vh]" },
              {
                default: () => [
                  h(DrawerHeader),
                  h("div", { class: "p-6 overflow-auto" }, [
                    h(
                      "div",
                      {
                        class:
                          "rounded-md overflow-hidden border-[3px] border-black shadow-neo",
                      },
                      [
                        h("iframe", {
                          src: iframeUrl(),
                          class: `w-full h-[${iframeHeight.value}] border-0`,
                          onLoad: () => {
                            iframeLoaded.value = true;
                          },
                        }),
                      ]
                    ),
                  ]),
                ],
              }
            ),
          ],
        }
      );
    };
  },
});
