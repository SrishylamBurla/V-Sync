import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
  reducer: {
    app: (state = {}) => state,
  },
});

export default store;