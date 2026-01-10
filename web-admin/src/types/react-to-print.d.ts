import type { UseReactToPrintHookContent } from "react-to-print/lib/types/UseReactToPrintHookContent";

declare module "react-to-print" {
  interface UseReactToPrintOptions {
    content?: UseReactToPrintHookContent;
  }
}
