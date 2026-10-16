"use client";

import { motion } from "framer-motion";

interface GamePageHeroProps {
  slug: string;
  name: string;
  imageUrl?: string | null;
}

export function GamePageHero({
  slug,
  name,
  imageUrl,
}: GamePageHeroProps) {
  return (
    <motion.div
      layoutId={`game-card-${slug}`}
      className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"
      transition={{
        layout: {
          duration: 0.48,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
    >
      <motion.div
        layoutId={`game-image-${slug}`}
        className="relative overflow-hidden"
      >
        {imageUrl ? (
          <motion.img
            src={imageUrl}
            alt={name}
            className="h-48 w-full object-cover sm:h-64"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-white/[0.04] sm:h-64">
            <span className="text-2xl font-black text-white/30">
              {name}
            </span>
          </div>
        )}
      </motion.div>

      <motion.div
        layoutId={`game-content-${slug}`}
        className="p-5 sm:p-6"
      >
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          {name}
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Top Up {name} dengan cepat, aman, dan otomatis.
        </p>
      </motion.div>
    </motion.div>
  );
}
