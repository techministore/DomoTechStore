import { onRequest as __banggood_categories_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\banggood\\categories\\index.js"
import { onRequest as __banggood_details_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\banggood\\details\\index.js"
import { onRequest as __banggood_offers_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\banggood\\offers\\index.js"
import { onRequest as __banggood_search_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\banggood\\search\\index.js"
import { onRequest as __banggood_index_js_onRequest } from "C:\\Users\\Usuario\\Documents\\GitHub\\DomoTechStore\\functions\\banggood\\index.js"

export const routes = [
    {
      routePath: "/banggood/categories",
      mountPath: "/banggood/categories",
      method: "",
      middlewares: [],
      modules: [__banggood_categories_index_js_onRequest],
    },
  {
      routePath: "/banggood/details",
      mountPath: "/banggood/details",
      method: "",
      middlewares: [],
      modules: [__banggood_details_index_js_onRequest],
    },
  {
      routePath: "/banggood/offers",
      mountPath: "/banggood/offers",
      method: "",
      middlewares: [],
      modules: [__banggood_offers_index_js_onRequest],
    },
  {
      routePath: "/banggood/search",
      mountPath: "/banggood/search",
      method: "",
      middlewares: [],
      modules: [__banggood_search_index_js_onRequest],
    },
  {
      routePath: "/banggood",
      mountPath: "/banggood",
      method: "",
      middlewares: [],
      modules: [__banggood_index_js_onRequest],
    },
  ]