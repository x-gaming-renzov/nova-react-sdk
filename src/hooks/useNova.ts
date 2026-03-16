import { useCallback, useContext, useEffect, useRef } from "react";
import { NovaContext } from "../context/NovaContext";

export const useNova = () => {
  const context = useContext(NovaContext);

  if (context === undefined) {
    throw new Error("useNova must be used within a NovaProvider");
  }

  return context;
};

export const useNovaExperience = <T extends Record<string, any>>(
  experienceName: string
) => {
  const {
    loadExperience,
    isExperienceLoaded,
    readExperience,
    getExperience,
    state,
  } = useNova();

  const objects = readExperience<T>(experienceName);
  const loaded = isExperienceLoaded(experienceName);
  const loading = state.isLoading;
  const error = state.error;

  const load = useCallback(async () => {
    await loadExperience(experienceName);
  }, [loadExperience, experienceName]);

  const get = useCallback(async () => {
    await getExperience(experienceName);
  }, [getExperience, experienceName]);

  return {
    objects,
    loaded,
    loading,
    error,
    load,
    get,
  };
};

export const useNovaSubscription = (experienceNames: string[]) => {
  const { subscribe, unsubscribe } = useNova();
  const serialized = JSON.stringify(experienceNames);
  const prevRef = useRef<string>(serialized);

  useEffect(() => {
    if (experienceNames.length === 0) return;

    subscribe(experienceNames);
    prevRef.current = serialized;

    return () => {
      unsubscribe(experienceNames);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, subscribe, unsubscribe]);
};

export const useNovaInit = () => {
  const { loadAllExperiences, state } = useNova();

  useEffect(() => {
    const initialize = async () => {
      // Then try to load from backend
      await loadAllExperiences();
    };

    initialize();
  }, [loadAllExperiences]);

  return {
    isReady: Object.keys(state.experiences).length > 0,
    loading: state.isLoading,
    error: state.error,
  };
};
