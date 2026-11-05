import shorts from "@/assets/shorts.jpg";
import shirts from "@/assets/shirts.jpg";
import gymWear from "@/assets/gym-wear.jpg";
import tracksuit from "@/assets/tracksuit.jpg";
import footballKit from "@/assets/football-kit.jpg";
import taekwondo from "@/assets/taekwondo.jpg";
import wushu from "@/assets/wushu.jpg";
import karate from "@/assets/karate.jpg";

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

export const categories: Category[] = [
  {
    slug: "custom-shorts",
    name: "Custom Sports Shorts",
    tagline: "Sublimated, embroidered — made to your design",
    image: shorts.src,
  },
  {
    slug: "shirts-tank-tops",
    name: "Shirts & Tank Tops",
    tagline: "Performance jerseys and gym tanks",
    image: shirts.src,
  },
  {
    slug: "gym-wear",
    name: "Gym & Training Wear",
    tagline: "Breathable fabric, built to train hard",
    image: gymWear.src,
  },
  {
    slug: "tracksuits-sona-suits",
    name: "Tracksuits & Sona Suits",
    tagline: "Full tracksuits and warm-up suits",
    image: tracksuit.src,
  },
  {
    slug: "football-kits",
    name: "Customized Football Kits",
    tagline: "Your club colors, names and numbers",
    image: footballKit.src,
  },
  {
    slug: "taekwondo",
    name: "Taekwondo Dobok",
    tagline: "WT-approved cuts, belt sizes all ages",
    image: taekwondo.src,
  },
  {
    slug: "wushu",
    name: "Wushu Uniforms",
    tagline: "Satin competition and training sets",
    image: wushu.src,
  },
  {
    slug: "karate",
    name: "Karate Gi",
    tagline: "Kumite and kata weights available",
    image: karate.src,
  },
];

export const marqueeItems = [
  "Custom Shorts",
  "Football Kits",
  "Taekwondo Dobok",
  "Wushu Uniforms",
  "Karate Gi",
  "Gym Wear",
  "Tracksuits",
  "Sona Suits",
  "Tank Tops",
  "Team Orders",
];
