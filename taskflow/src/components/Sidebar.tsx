import React, { ReactText } from "react";
import {
  IconButton,
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  BoxProps,
  FlexProps,
} from "@chakra-ui/react";
import {
  FiHome,
  FiTrendingUp,
  FiCompass,
  FiStar,
  FiSettings,
  FiMenu,
  FiArchive,
} from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import { IconType } from "react-icons";
import { Link as RouterLink, useLocation } from "react-router-dom";

interface LinkItemProps {
  name: string;
  icon: IconType;
  to: string;
}

// Navigation items for sidebar
const LinkItems: Array<LinkItemProps> = [
  { name: "Dashboard", icon: FiHome, to: "/" },
  { name: "Wszystkie Zakładki", icon: FiCompass, to: "/bookmarks" },
  { name: "Ulubione", icon: FiStar, to: "/favorites" },
  { name: "Archiwum", icon: FiArchive, to: "/archive" },
  { name: "Analiza AI", icon: FaRobot, to: "/analysis" },
  { name: "Statystyki", icon: FiTrendingUp, to: "/analytics" },
  { name: "Ustawienia", icon: FiSettings, to: "/settings" },
]; 