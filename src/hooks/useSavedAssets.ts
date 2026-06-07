"use client";

import { useEffect, useState } from "react";
import { SavedAsset, SavedAssetInput, subscribeSavedAssets, saveAsset, deleteAsset } from "@/lib/savedAssets";

export function useSavedAssets(courseId: string) {
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeSavedAssets(
      courseId,
      (items) => {
        setAssets(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [courseId]);

  const addAsset = async (input: SavedAssetInput) => saveAsset(courseId, input);
  const removeAsset = async (assetId: string) => deleteAsset(courseId, assetId);

  return { assets, loading, addAsset, removeAsset };
}
