import { onRequest as __aliexpress_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\aliexpress\\index.js"
import { onRequest as __amazon_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\amazon\\index.js"
import { onRequest as __banggood_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\banggood\\index.js"

export const routes = [
    {
      routePath: "/aliexpress",
      mountPath: "/aliexpress",
      method: "",
      middlewares: [],
      modules: [__aliexpress_index_js_onRequest],
    },
  {
      routePath: "/amazon",
      mountPath: "/amazon",
      method: "",
      middlewares: [],
      modules: [__amazon_index_js_onRequest],
    },
  {
      routePath: "/banggood",
      mountPath: "/banggood",
      method: "",
      middlewares: [],
      modules: [__banggood_index_js_onRequest],
    },
  ]