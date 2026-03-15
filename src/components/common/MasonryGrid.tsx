"use client";

import { Box } from "@mantine/core";
import React from "react";
import classes from "./MasonryGrid.module.css";

interface MasonryGridProps {
  children: React.ReactNode;
}

export function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <Box className={classes.masonry}>
      {children}
    </Box>
  );
}
