import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 30000 });

export const fetchDiscover = (params) => api.get("/games/discover", { params }).then((r) => r.data);
export const fetchGame = (id) => api.get(`/games/${id}`).then((r) => r.data);
export const fetchGenres = () => api.get("/games/genres").then((r) => r.data);
export const fetchPlatforms = () => api.get("/games/platforms").then((r) => r.data);

export const getRig = () => api.get("/rig").then((r) => r.data);
export const saveRig = (rig) => api.post("/rig", rig).then((r) => r.data);

export const listLibrary = (status) =>
    api.get("/library", { params: status ? { status } : {} }).then((r) => r.data);
export const addLibrary = (item) => api.post("/library", item).then((r) => r.data);
export const patchLibrary = (id, patch) => api.patch(`/library/${id}`, patch).then((r) => r.data);
export const deleteLibrary = (id) => api.delete(`/library/${id}`).then((r) => r.data);

export const checkCompat = (payload) => api.post("/compatibility/check", payload).then((r) => r.data);
export const recRule = (payload) => api.post("/recommendations/rule", payload).then((r) => r.data);
export const recAI = (payload) => api.post("/recommendations/ai", payload).then((r) => r.data);
