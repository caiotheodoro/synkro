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
    const isOpen = ref(false);
    const iframeLoaded = ref(false);
    const iframeHeight = computed(() =>
      props.type === "login" ? "500px" : "600px"
    );

    // Function to handle authentication success
    const handleAuthSuccess = (event: MessageEvent) => {
      // Verify the origin of the message
      if (event.origin !== "http://localhost:5173") return;

      // Handle authentication success
      if (event.data.type === "AUTH_SUCCESS") {
        // Store auth data
        localStorage.setItem("synkro_user", JSON.stringify(event.data.user));
        localStorage.setItem("synkro_token", event.data.access_token);

        // Close the drawer
        const closeEvent = new CustomEvent("drawer:close");
        window.dispatchEvent(closeEvent);

        // Refresh the page to update UI
        window.location.reload();
      }
    };

    // Check if user is already signed in
    const checkAuthStatus = () => {
      return localStorage.getItem("synkro_token") !== null;
    };

    onMounted(() => {
      // Listen for messages from the auth iframe
      window.addEventListener("message", handleAuthSuccess);

      // Return cleanup function
      return () => {
        window.removeEventListener("message", handleAuthSuccess);
      };
    });

    // Determine the iframe URL based on the type prop
    const iframeUrl = () => {
      const baseUrl = "http://localhost:5173";
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
