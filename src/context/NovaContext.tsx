import React, {
  createContext,
  useReducer,
  useRef,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { callApi } from "../service/api";

// --- Storage adapter ---

export interface NovaStorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

const localStorageAdapter: NovaStorageAdapter = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail (SSR, privacy mode)
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

// --- Anonymous ID helpers ---

const ANON_STORAGE_PREFIX = "nova_anonymous_id";

function getStorageKey(apiKey: string): string {
  const suffix = apiKey.slice(-8);
  return `${ANON_STORAGE_PREFIX}_${suffix}`;
}

function generateAnonymousId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getOrCreateAnonymousId(
  apiKey: string,
  storage: NovaStorageAdapter
): Promise<string> {
  const key = getStorageKey(apiKey);
  try {
    const stored = await storage.getItem(key);
    if (stored) return stored;
  } catch {
    // Storage read failed
  }
  const id = generateAnonymousId();
  try {
    await storage.setItem(key, id);
  } catch {
    // Silently fail — works for current session, won't persist
  }
  return id;
}

async function clearAnonymousIdFromStorage(
  apiKey: string,
  storage: NovaStorageAdapter
): Promise<void> {
  try {
    await storage.removeItem(getStorageKey(apiKey));
  } catch {
    // Ignore
  }
}

interface IdentifyResponse {
  nova_user_id: string;
  merged: boolean;
}

export interface NovaEventBatchConfig {
  maxSize?: number;       // flush when queue reaches this size (default: 10)
  flushInterval?: number; // flush every N milliseconds (default: 5000)
}

export interface LoadExperienceOptions {
  payload?: Record<string, any>;
}

export interface NovaConfig {
  apiKey: string;
  apiEndpoint: string;
  noticeServiceUrl?: string;
  storage?: NovaStorageAdapter;
  eventBatch?: NovaEventBatchConfig;
  registry: {
    objects: {
      [objectName: string]: {
        type: string;
        keys: {
          [keyName: string]: {
            type: string;
            description: string;
            default: any;
          };
        };
      };
    };
    experiences: {
      [experienceName: string]: {
        description: string;
        objects: {
          [objectName: string]: boolean;
        };
      };
    };
  };
}

export type UserProfile = Record<string, any>;

export interface NovaUser {
  userId: string;
  userProfile: UserProfile;

  novaUserId?: string;
}

export interface SetNovaUser {
  userId: string;
  userProfile: UserProfile;
}

export type NovaObjectConfig = Record<string, any>;

export interface NovaObject {
  config: NovaObjectConfig;
  variantName: string | null;
}

export interface NovaExperience {
  personalisationName: string | null;
  objects: {
    [objectName: string]: NovaObject;
  };
  evaluationReason: string | null;
  isLoaded: boolean;
  lastFetched?: Date;
}

export interface NovaExperiences {
  [experienceName: string]: NovaExperience;
}

export interface NovaState {
  config: NovaConfig;
  user: NovaUser | null;
  anonymousId: string | null;

  isLoading: boolean;
  error: string | null;

  experiences: NovaExperiences;
}

export interface NovaExperienceResponse {
  experience_id: string;
  personalisation_id: string | null;
  personalisation_name: string | null;
  experience_variant_id: string | null;
  features: {
    [featureName: string]: {
      feature_id: string;
      feature_name: string;
      variant_id: string | null;
      variant_name: string | null;
      config: NovaObjectConfig;
    };
  };
  evaluation_reason: string;
}

export interface GetExperiencesResponse {
  [experienceName: string]: NovaExperienceResponse;
}

type NovaAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CONFIG"; payload: Partial<NovaConfig> }
  | { type: "SET_USER"; payload: NovaUser }
  | { type: "UPDATE_USER_PROFILE"; payload: UserProfile }
  | { type: "SET_ANONYMOUS_ID"; payload: string }
  | { type: "CLEAR_ANONYMOUS_ID" }
  | {
      type: "SET_EXPERIENCE";
      payload: { experienceName: string; experience: NovaExperience };
    }
  | {
      type: "SET_EXPERIENCES";
      payload: { [experienceName: string]: NovaExperience };
    };

// Create context
export interface NovaContextValue {
  state: NovaState;
  dispatch: React.Dispatch<NovaAction>;

  // Utility methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // User methods
  setUser: (user: SetNovaUser) => Promise<void>;
  identify: (userId: string, userProfile?: UserProfile) => Promise<void>;
  updateUserProfile: (userProfile: UserProfile) => Promise<void>;

  // Experience Load methods
  loadExperience: (experienceName: string, options?: LoadExperienceOptions) => Promise<void>;
  loadExperiences: (experienceNames: string[] | null, options?: LoadExperienceOptions) => Promise<void>;
  loadAllExperiences: () => Promise<void>;

  // Experience get methods
  isExperienceLoaded: (experienceName: string) => boolean;
  readExperience: <T extends Record<string, any>>(
    experienceName: string
  ) => T | null;
  getExperience: <T extends Record<string, any>>(
    experienceName: string,
    options?: LoadExperienceOptions
  ) => Promise<T | null>;

  // Subscription methods (SSE real-time updates)
  subscribe: (experienceNames: string[]) => void;
  unsubscribe: (experienceNames: string[]) => void;

  // Analytics methods
  trackEvent: (
    eventName: string,
    eventData?: Record<string, any>
  ) => void;
  flushEvents: () => Promise<void>;
}

export const NovaContext = createContext<NovaContextValue | undefined>(
  undefined
);

const novaReducer = (state: NovaState, action: NovaAction): NovaState => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "SET_CONFIG":
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      };

    case "SET_ANONYMOUS_ID":
      return {
        ...state,
        anonymousId: action.payload,
      };

    case "CLEAR_ANONYMOUS_ID":
      return {
        ...state,
        anonymousId: null,
      };

    case "UPDATE_USER_PROFILE":
      if (!state.user) {
        return state;
      }

      return {
        ...state,
        user: {
          ...state.user,
          userProfile: { ...state.user.userProfile, ...action.payload },
        },
      };

    case "SET_EXPERIENCE":
      return {
        ...state,
        experiences: {
          ...state.experiences,
          [action.payload.experienceName]: action.payload.experience,
        },
      };

    case "SET_EXPERIENCES":
      return {
        ...state,
        experiences: { ...state.experiences, ...action.payload },
      };

    default:
      return state;
  }
};

interface NovaProviderProps {
  children: ReactNode;
  config: NovaConfig;
}

export const NovaProvider: React.FC<NovaProviderProps> = ({
  children,
  config,
}) => {
  const storage = config.storage ?? localStorageAdapter;
  const registry = config.registry;
  const defaultExperiences: NovaExperiences = {};

  for (const [experienceName, experienceData] of Object.entries(
    registry.experiences
  )) {
    const defaultExperienceObjects: {
      [objectName: string]: NovaObject;
    } = {};

    for (const [objectName, objectEnabled] of Object.entries(
      experienceData.objects
    )) {
      if (!objectEnabled) {
        continue;
      }

      const objectData = registry.objects[objectName];

      if (!objectData) {
        continue;
      }

      const objectKeys = objectData.keys;

      const defaultObjectConfig: NovaObjectConfig = {};

      for (const [keyName, keyData] of Object.entries(objectKeys)) {
        defaultObjectConfig[keyName] = keyData.default;
      }

      defaultExperienceObjects[objectName] = {
        variantName: null,
        config: defaultObjectConfig,
      };
    }

    defaultExperiences[experienceName] = {
      personalisationName: null,
      objects: defaultExperienceObjects,
      evaluationReason: null,
      isLoaded: false,
    };

    console.log(`[Nova SDK] Registry defaults for "${experienceName}":`, JSON.stringify(defaultExperienceObjects, null, 2));
  }

  const initialState: NovaState = {
    config,
    user: null,
    anonymousId: null,
    isLoading: false,
    error: null,
    experiences: defaultExperiences,
  };

  const [state, dispatch] = useReducer(novaReducer, initialState);

  // Initialize anonymous ID on mount and register anonymous user on backend
  useEffect(() => {
    if (!state.user) {
      (async () => {
        const anonId = await getOrCreateAnonymousId(config.apiKey, storage);
        dispatch({ type: "SET_ANONYMOUS_ID", payload: anonId });

        try {
          const userResponse = await callApi<{ nova_user_id: string }>(
            `${config.apiEndpoint}/api/v1/users/create-user/`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
              },
              body: JSON.stringify({
                user_id: anonId,
                user_profile: {},
              }),
            }
          );

          // If identify was called while /create-user was in-flight,
          // don't overwrite the identified user with the anon user
          if (!identifyCalledRef.current) {
            dispatch({
              type: "SET_USER",
              payload: {
                userId: anonId,
                userProfile: {},
                novaUserId: userResponse.nova_user_id,
              },
            });
          }
        } catch {
          // Network failure — anonymous events still work via anonymousId,
          // profile updates won't work until network recovers
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility methods
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  // Analytics methods — batched event tracking
  const batchMaxSize = config.eventBatch?.maxSize ?? 10;
  const batchFlushInterval = config.eventBatch?.flushInterval ?? 5000;

  interface QueuedEvent {
    event_name: string;
    event_data: Record<string, any>;
    timestamp: string;
  }

  const eventQueueRef = useRef<QueuedEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const identifyCalledRef = useRef(false);
  const payloadCacheRef = useRef<Map<string, Record<string, any>>>(new Map());

  // SSE subscription refs
  const sseAbortRef = useRef<AbortController | null>(null);
  const subscribedNamesRef = useRef<Set<string>>(new Set());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  const flushEvents = useCallback(async () => {
    const queue = eventQueueRef.current;
    if (queue.length === 0) return;

    const effectiveUserId = state.user?.userId ?? state.anonymousId;
    if (!state.config.apiKey || !effectiveUserId) return;

    // Drain the queue
    const events = queue.splice(0, queue.length);

    try {
      await callApi<{ success: boolean; count: number }>(
        `${state.config.apiEndpoint}/api/v1/metrics/track-events/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.config.apiKey}`,
          },
          body: JSON.stringify({
            user_id: effectiveUserId,
            events,
          }),
        }
      );
    } catch {
      // Put events back at the front of the queue for retry on next flush
      eventQueueRef.current.unshift(...events);
    }
  }, [state.config, state.user?.userId, state.anonymousId]);

  const trackEvent = useCallback(
    (eventName: string, eventData?: Record<string, any>) => {
      if (!state.config.apiKey) return;
      const effectiveUserId = state.user?.userId ?? state.anonymousId;
      if (!effectiveUserId) return;

      eventQueueRef.current.push({
        event_name: eventName,
        event_data: eventData || {},
        timestamp: new Date().toISOString(),
      });

      // Flush immediately if queue reached max size
      if (eventQueueRef.current.length >= batchMaxSize) {
        flushEvents();
      }
    },
    [state.config, state.user?.userId, state.anonymousId, batchMaxSize, flushEvents]
  );

  // Internal: raw user creation (no identify logic)
  const createUser = useCallback(
    async (user: SetNovaUser): Promise<NovaUser> => {
      const userResponse = await callApi<{ nova_user_id: string }>(
        `${state.config.apiEndpoint}/api/v1/users/create-user/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.config.apiKey}`,
          },
          body: JSON.stringify({
            user_id: user.userId,
            user_profile: user.userProfile,
          }),
        }
      );

      return {
        userId: user.userId,
        userProfile: user.userProfile,
        novaUserId: userResponse.nova_user_id,
      };
    },
    [state.config]
  );

  // Identify: merge anonymous session → authenticated user
  const identify = useCallback(
    async (userId: string, userProfile?: UserProfile) => {
      identifyCalledRef.current = true;
      const anonymousId = state.anonymousId;

      if (!anonymousId) {
        // No anonymous session — fall back to plain create
        const novaUser = await createUser({
          userId,
          userProfile: userProfile ?? {},
        });
        dispatch({ type: "SET_USER", payload: novaUser });
        return;
      }

      // Flush pending events so they are sent with the anonymous ID
      await flushEvents();

      const identifyResponse = await callApi<IdentifyResponse>(
        `${state.config.apiEndpoint}/api/v1/users/identify/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.config.apiKey}`,
          },
          body: JSON.stringify({
            anonymous_id: anonymousId,
            identified_id: userId,
            user_profile: userProfile ?? {},
          }),
        }
      );

      dispatch({
        type: "SET_USER",
        payload: {
          userId,
          userProfile: userProfile ?? {},
          novaUserId: identifyResponse.nova_user_id,
        },
      });
      dispatch({ type: "CLEAR_ANONYMOUS_ID" });
      await clearAnonymousIdFromStorage(state.config.apiKey, storage);
    },
    [state.config, state.anonymousId, storage, createUser, flushEvents]
  );

  const setUser = useCallback(
    async (user: SetNovaUser) => {
      if (state.anonymousId) {
        await identify(user.userId, user.userProfile);
        return;
      }

      const novaUser = await createUser(user);
      dispatch({ type: "SET_USER", payload: novaUser });
    },
    [state.anonymousId, identify, createUser]
  );

  const updateUserProfile = useCallback(
    async (userProfile: UserProfile) => {
      if (!state.user) return;

      dispatch({ type: "UPDATE_USER_PROFILE", payload: userProfile });

      await callApi<{ nova_user_id: string }>(
        `${state.config.apiEndpoint}/api/v1/users/update-user-profile/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.config.apiKey}`,
          },
          body: JSON.stringify({
            user_id: state.user.userId,
            user_profile: userProfile,
          }),
        }
      );
    },
    [state.config, state.user]
  );

  // Experiences Load Methods
  const loadExperience = useCallback(
    async (experienceName: string, options?: LoadExperienceOptions) => {
      const effectiveUserId = state.user?.userId ?? state.anonymousId;
      if (!effectiveUserId) {
        throw new Error("User must be set before loading experiences");
      }

      // Cache payload for SSE-triggered reloads
      if (options?.payload) {
        payloadCacheRef.current.set(experienceName, options.payload);
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`[Nova SDK] loadExperience("${experienceName}") — requesting for user:`, effectiveUserId);

        const requestBody: Record<string, any> = {
          user_id: effectiveUserId,
          experience_name: experienceName,
        };
        const cachedPayload = payloadCacheRef.current.get(experienceName);
        if (cachedPayload) {
          requestBody.payload = cachedPayload;
        }

        const data = await callApi<NovaExperienceResponse>(
          `${state.config.apiEndpoint}/api/v1/user-experience/get-experience/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${state.config.apiKey}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        console.log(`[Nova SDK] loadExperience("${experienceName}") — raw API response:`, JSON.stringify(data, null, 2));

        const experienceObjects: { [objectName: string]: NovaObject } = {};
        const registryDefaults = defaultExperiences[experienceName]?.objects ?? {};

        for (const [featureName, featureData] of Object.entries(
          data.features
        )) {
          // Merge: registry defaults ← API response (variant overrides win)
          const defaultConfig = registryDefaults[featureName]?.config ?? {};
          experienceObjects[featureName] = {
            variantName: featureData.variant_name,
            config: { ...defaultConfig, ...featureData.config },
          };
        }

        const novaExperience: NovaExperience = {
          personalisationName: data?.personalisation_name,
          evaluationReason: data?.evaluation_reason,
          isLoaded: true,
          lastFetched: new Date(),
          objects: experienceObjects,
        };

        console.log(`[Nova SDK] loadExperience("${experienceName}") — evaluated result:`, {
          personalisation: data?.personalisation_name ?? "none (defaults)",
          reason: data?.evaluation_reason,
          objects: Object.fromEntries(
            Object.entries(experienceObjects).map(([name, obj]) => [
              name,
              { variant: obj.variantName ?? "default", config: obj.config },
            ])
          ),
        });

        dispatch({
          type: "SET_EXPERIENCE",
          payload: {
            experienceName,
            experience: novaExperience,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(
          `Failed to load experience "${experienceName}": ${errorMessage}`
        );

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [state.config, state.user, state.anonymousId, setLoading, setError]
  );

  const loadExperiences = useCallback(
    async (experienceNames: string[] | null = null, options?: LoadExperienceOptions) => {
      const effectiveUserId = state.user?.userId ?? state.anonymousId;
      if (!effectiveUserId) {
        throw new Error("User must be set before loading experiences");
      }

      // Cache payload for all requested experiences (used by SSE-triggered reloads)
      if (options?.payload && experienceNames) {
        for (const name of experienceNames) {
          payloadCacheRef.current.set(name, options.payload);
        }
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`[Nova SDK] loadExperiences(${experienceNames ? JSON.stringify(experienceNames) : "all"}) — requesting for user:`, effectiveUserId);

        const requestBody: Record<string, any> = {
          user_id: effectiveUserId,
          experience_names: experienceNames,
        };
        if (options?.payload) {
          requestBody.payload = options.payload;
        }

        const data = await callApi<GetExperiencesResponse>(
          `${state.config.apiEndpoint}/api/v1/user-experience/get-experiences/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${state.config.apiKey}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        console.log(`[Nova SDK] loadExperiences — raw API response:`, JSON.stringify(data, null, 2));

        // Map GetExperiencesResponse to NovaExperiences
        const novaExperiences: NovaExperiences = {};

        for (const [experienceName, experienceData] of Object.entries(data)) {
          const experienceObjects: { [objectName: string]: NovaObject } = {};
          const registryDefaults = defaultExperiences[experienceName]?.objects ?? {};

          for (const [featureName, featureData] of Object.entries(
            experienceData.features
          )) {
            // Merge: registry defaults ← API response (variant overrides win)
            const defaultConfig = registryDefaults[featureName]?.config ?? {};
            experienceObjects[featureName] = {
              variantName: featureData.variant_name,
              config: { ...defaultConfig, ...featureData.config },
            };
          }

          const novaExperience: NovaExperience = {
            personalisationName: experienceData.personalisation_name,
            evaluationReason: experienceData.evaluation_reason,
            isLoaded: true,
            lastFetched: new Date(),
            objects: experienceObjects,
          };

          novaExperiences[experienceName] = novaExperience;

          console.log(`[Nova SDK] loadExperiences — "${experienceName}" evaluated:`, {
            personalisation: experienceData.personalisation_name ?? "none (defaults)",
            reason: experienceData.evaluation_reason,
            objects: Object.fromEntries(
              Object.entries(experienceObjects).map(([name, obj]) => [
                name,
                { variant: obj.variantName ?? "default", config: obj.config },
              ])
            ),
          });
        }

        dispatch({
          type: "SET_EXPERIENCES",
          payload: novaExperiences,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(
          `Failed to load experiences "${
            experienceNames ? experienceNames.join(", ") : "all"
          }": ${errorMessage}`
        );

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [state.config, state.user, state.anonymousId, setLoading, setError]
  );

  const loadAllExperiences = useCallback(async () => {
    await loadExperiences(null);
  }, [loadExperiences]);

  // Experience get methods
  const isExperienceLoaded = useCallback(
    (experienceName: string) => {
      return state.experiences[experienceName]?.isLoaded || false;
    },
    [state.experiences]
  );

  const readExperience = useCallback(
    <T extends Record<string, any>>(experienceName: string) => {
      const experience = state.experiences[experienceName];

      if (!experience) {
        return null;
      }

      const experienceFeatures: { [objectName: string]: NovaObjectConfig } = {};

      for (const [objectName, object] of Object.entries(experience.objects)) {
        experienceFeatures[objectName] = object.config;
      }

      return experienceFeatures as T;
    },
    [state.experiences]
  );

  const getExperience = useCallback(
    async <T extends Record<string, any>>(experienceName: string, options?: LoadExperienceOptions) => {
      if (!isExperienceLoaded(experienceName)) {
        await loadExperience(experienceName, options);
      }

      return readExperience<T>(experienceName);
    },
    [state.experiences, isExperienceLoaded, loadExperience, readExperience]
  );

  // ── SSE subscription ───────────────────────────────────────────────────────

  const connectSSE = useCallback(() => {
    const noticeUrl = state.config.noticeServiceUrl;
    const names = subscribedNamesRef.current;
    if (!noticeUrl || names.size === 0) return;

    // Abort previous connection
    sseAbortRef.current?.abort();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const abort = new AbortController();
    sseAbortRef.current = abort;

    const url =
      `${noticeUrl}/subscribe` +
      `?experience_names=${encodeURIComponent(Array.from(names).join(","))}` +
      `&token=${encodeURIComponent(state.config.apiKey)}`;

    console.log(`[Nova SDK] SSE connecting to notice service, watching ${names.size} experience(s)`);

    (async () => {
      try {
        const response = await fetch(url, {
          signal: abort.signal,
          headers: { Accept: "text/event-stream" },
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE connect failed: ${response.status}`);
        }

        reconnectAttemptRef.current = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            let eventType = "";
            let eventData = "";

            for (const line of frame.split("\n")) {
              if (line.startsWith("event: ")) eventType = line.slice(7);
              else if (line.startsWith("data: ")) eventData = line.slice(6);
            }

            if (eventType === "connected") {
              console.log("[Nova SDK] SSE connected");
              // Initial pull — reload all subscribed experiences with cached payloads
              const subNames = Array.from(subscribedNamesRef.current);
              if (subNames.length > 0) {
                loadExperiences(subNames).catch(() => {});
              }
            } else if (eventType === "pull_update") {
              try {
                const payload = JSON.parse(eventData);
                const affectedIds: string[] = payload.experience_ids ?? [];
                // Only reload experiences we're subscribed to
                const toReload = affectedIds.filter((id) =>
                  subscribedNamesRef.current.has(id)
                );
                if (toReload.length > 0) {
                  console.log(`[Nova SDK] SSE push — reloading ${toReload.length} experience(s)`);
                  loadExperiences(toReload).catch(() => {});
                }
              } catch {
                // Malformed data, ignore
              }
            }
            // heartbeat — ignore
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return; // Intentional disconnect
        console.warn("[Nova SDK] SSE error:", err?.message ?? err);
      }

      // Reconnect with exponential backoff (if not intentionally aborted)
      if (!abort.signal.aborted && subscribedNamesRef.current.size > 0) {
        const attempt = reconnectAttemptRef.current++;
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`[Nova SDK] SSE reconnecting in ${delay}ms (attempt ${attempt + 1})`);
        reconnectTimerRef.current = setTimeout(connectSSE, delay);
      }
    })();
  }, [state.config.noticeServiceUrl, state.config.apiKey, loadExperiences]);

  const subscribe = useCallback(
    (experienceNames: string[]) => {
      const names = subscribedNamesRef.current;
      const before = names.size;
      for (const name of experienceNames) {
        names.add(name);
      }
      if (names.size !== before) {
        // Set changed — reconnect to update server-side filter
        connectSSE();
      }
    },
    [connectSSE]
  );

  const unsubscribe = useCallback(
    (experienceNames: string[]) => {
      const names = subscribedNamesRef.current;
      const before = names.size;
      for (const name of experienceNames) {
        names.delete(name);
      }
      if (names.size !== before) {
        if (names.size === 0) {
          // No more subscriptions — disconnect
          sseAbortRef.current?.abort();
          sseAbortRef.current = null;
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
        } else {
          // Set changed — reconnect to update server-side filter
          connectSSE();
        }
      }
    },
    [connectSSE]
  );

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      sseAbortRef.current?.abort();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  // Flush on interval
  useEffect(() => {
    flushTimerRef.current = setInterval(() => {
      flushEvents();
    }, batchFlushInterval);

    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
      // Flush remaining events on unmount
      flushEvents();
    };
  }, [flushEvents, batchFlushInterval]);

  const value: NovaContextValue = {
    state,
    dispatch,

    setLoading,
    setError,

    setUser,
    identify,
    updateUserProfile,

    loadExperience,
    loadExperiences,
    loadAllExperiences,

    isExperienceLoaded,
    readExperience,
    getExperience,

    subscribe,
    unsubscribe,

    trackEvent,
    flushEvents,
  };

  return <NovaContext.Provider value={value}>{children}</NovaContext.Provider>;
};
