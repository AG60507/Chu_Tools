import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "俄羅斯方塊",
};

export default function TetrisLayout({ children }: LayoutProps<"/tetris">) {
  return children;
}
