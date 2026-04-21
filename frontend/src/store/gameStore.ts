import { create } from "zustand";

export type Player = {
  energy: number;
  mood: number;
  money: number;
  xp: number;
  level: number;
  job: string;
  laptop: string | null;
  home: string;
  transport: string;
};

export type Job = {
  name: string;
  min_level: number;
  laptop: string | null;
  income: number[];
};

export type PricedItem = { name: string; price: number };
export type TransportItem = { name: string; price: number; work_bonus: number };
export type FunActivity = { id: string; title: string; price: number; mood: number };

export type GameStatePayload = {
  player: Player;
  log: string[];
  jobs: Job[];
  laptops: PricedItem[];
  homes: PricedItem[];
  transport: TransportItem[];
  fun_activities: FunActivity[];
  music_tracks: string[];
};

export type ModalTab = "skills" | "work" | "shop" | "relations" | "fun" | null;
export type ShopTabKey = "pms" | "cygan" | "korita";
export type WorkTabKey = "freelance" | "career";

const TABS = ["skills", "work", "shop", "relations", "fun"] as const;
const STORE_KEYS: ShopTabKey[] = ["pms", "cygan", "korita"];
const WORK_KEYS: WorkTabKey[] = ["freelance", "career"];

type GameStore = GameStatePayload & {
  ready: boolean;
  load: () => Promise<void>;
  postWork: () => Promise<void>;
  postFun: (activityId: string) => Promise<void>;
  buyLaptop: (name: string) => Promise<void>;
  applyJob: (name: string) => Promise<void>;
  buyHome: (name: string) => Promise<void>;
  buyTransport: (name: string) => Promise<void>;

  modal: ModalTab;
  shopTab: ShopTabKey;
  workTab: WorkTabKey;
  openModal: (
    name: Exclude<ModalTab, null>,
    opts?: { store?: ShopTabKey; worktab?: WorkTabKey; skipUrl?: boolean },
  ) => void;
  closeModals: (opts?: { skipUrl?: boolean }) => void;
  setShopTab: (key: ShopTabKey, opts?: { skipUrl?: boolean }) => void;
  setWorkTab: (key: WorkTabKey, opts?: { skipUrl?: boolean }) => void;
  syncUrl: (opts: { tab: string; store?: ShopTabKey; worktab?: WorkTabKey } | null) => void;
  initFromUrl: () => void;
};

async function postJson<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function mergePayload(set: (p: Partial<GameStore>) => void, data: GameStatePayload) {
  set({
    player: data.player,
    log: data.log,
    jobs: data.jobs,
    laptops: data.laptops,
    homes: data.homes,
    transport: data.transport,
    fun_activities: data.fun_activities,
    music_tracks: data.music_tracks,
  });
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: {
    energy: 0,
    mood: 0,
    money: 0,
    xp: 0,
    level: 1,
    job: "",
    laptop: null,
    home: "",
    transport: "",
  },
  log: [],
  jobs: [],
  laptops: [],
  homes: [],
  transport: [],
  fun_activities: [],
  music_tracks: [],
  ready: false,

  modal: null,
  shopTab: "pms",
  workTab: "freelance",

  syncUrl(opts) {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("open");
      if (!opts || !opts.tab) {
        u.searchParams.delete("tab");
        u.searchParams.delete("store");
        u.searchParams.delete("worktab");
      } else {
        u.searchParams.set("tab", opts.tab);
        if (opts.tab === "shop") {
          const sk = opts.store && STORE_KEYS.includes(opts.store) ? opts.store : "pms";
          u.searchParams.set("store", sk);
          u.searchParams.delete("worktab");
        } else if (opts.tab === "work") {
          const wk = opts.worktab && WORK_KEYS.includes(opts.worktab) ? opts.worktab : "freelance";
          u.searchParams.set("worktab", wk);
          u.searchParams.delete("store");
        } else {
          u.searchParams.delete("store");
          u.searchParams.delete("worktab");
        }
      }
      history.replaceState({}, "", u.pathname + u.search);
    } catch {
      /* ignore */
    }
  },

  load: async () => {
    const res = await fetch("/api/state");
    if (!res.ok) throw new Error("Не удалось загрузить состояние");
    const data = (await res.json()) as GameStatePayload;
    mergePayload(set, data);
    set({ ready: true });
  },

  postWork: async () => {
    const data = await postJson<GameStatePayload>("/api/work", {});
    mergePayload(set, data);
  },

  postFun: async (activityId: string) => {
    const data = await postJson<GameStatePayload>("/api/fun", { activity: activityId });
    mergePayload(set, data);
  },

  buyLaptop: async (name: string) => {
    const data = await postJson<GameStatePayload>("/api/buy_laptop", { name });
    mergePayload(set, data);
  },

  applyJob: async (name: string) => {
    const data = await postJson<GameStatePayload>("/api/apply_job", { name });
    mergePayload(set, data);
  },

  buyHome: async (name: string) => {
    const data = await postJson<GameStatePayload>("/api/buy_home", { name });
    mergePayload(set, data);
  },

  buyTransport: async (name: string) => {
    const data = await postJson<GameStatePayload>("/api/buy_transport", { name });
    mergePayload(set, data);
  },

  setShopTab(key, opts) {
    const k = STORE_KEYS.includes(key) ? key : "pms";
    set({ shopTab: k });
    const { modal, syncUrl: su } = get();
    if (!opts?.skipUrl && modal === "shop") su({ tab: "shop", store: k });
  },

  setWorkTab(key, opts) {
    const k = WORK_KEYS.includes(key) ? key : "freelance";
    set({ workTab: k });
    const { modal, syncUrl: su } = get();
    if (!opts?.skipUrl && modal === "work") su({ tab: "work", worktab: k });
  },

  openModal(name, opts) {
    const { syncUrl: su, setShopTab: sst, setWorkTab: swt } = get();
    set({ modal: name });
    if (name === "shop") {
      let sk: ShopTabKey = "pms";
      if (opts?.store && STORE_KEYS.includes(opts.store)) sk = opts.store;
      else {
        try {
          const qs = new URL(window.location.href).searchParams.get("store");
          if (qs && STORE_KEYS.includes(qs as ShopTabKey)) sk = qs as ShopTabKey;
        } catch {
          /* ignore */
        }
      }
      sst(sk, { skipUrl: true });
      if (!opts?.skipUrl) su({ tab: "shop", store: sk });
    } else if (name === "work") {
      let wk: WorkTabKey = "freelance";
      if (opts?.worktab && WORK_KEYS.includes(opts.worktab)) wk = opts.worktab;
      else {
        try {
          const qw = new URL(window.location.href).searchParams.get("worktab");
          if (qw && WORK_KEYS.includes(qw as WorkTabKey)) wk = qw as WorkTabKey;
        } catch {
          /* ignore */
        }
      }
      swt(wk, { skipUrl: true });
      if (!opts?.skipUrl) su({ tab: "work", worktab: wk });
    } else if (!opts?.skipUrl) {
      su({ tab: name });
    }
  },

  closeModals(opts) {
    set({ modal: null });
    if (!opts?.skipUrl) get().syncUrl(null);
  },

  initFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let fromOpen = params.get("open");
    let tab = params.get("tab");
    let store = params.get("store");
    let worktab = params.get("worktab");

    if (fromOpen === "homes") {
      tab = "shop";
      store = "cygan";
    } else if (fromOpen === "transport") {
      tab = "shop";
      store = "korita";
    }

    if (!tab || !TABS.includes(tab as (typeof TABS)[number])) return;

    const { openModal } = get();
    if (tab === "shop") {
      const sk0 = store && STORE_KEYS.includes(store as ShopTabKey) ? (store as ShopTabKey) : "pms";
      openModal("shop", { skipUrl: true, store: sk0 });
      get().syncUrl({ tab: "shop", store: sk0 });
    } else if (tab === "work") {
      const wk0 = worktab && WORK_KEYS.includes(worktab as WorkTabKey) ? (worktab as WorkTabKey) : "freelance";
      openModal("work", { skipUrl: true, worktab: wk0 });
      get().syncUrl({ tab: "work", worktab: wk0 });
    } else {
      openModal(tab as Exclude<ModalTab, null>, { skipUrl: true });
      get().syncUrl({ tab });
    }
  },
}));
