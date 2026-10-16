"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCard, type ProductCardProps } from "./ProductCard";

export function ProductCardWithWishlist(props: Omit<ProductCardProps, "onToggleFavorite">) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(props.isFavorited ?? false);

  async function handleToggleFavorite(productId: string) {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setIsFavorited(data.status === "added");
    }
  }

  return <ProductCard {...props} isFavorited={isFavorited} onToggleFavorite={handleToggleFavorite} />;
}
