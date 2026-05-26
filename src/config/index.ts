import setting from "@/assets/icons/app/setting.svg";
import music from "@/assets/icons/app/music.svg";
import personalization from "@/assets/icons/personalization.svg";

const appConfig = [
  {
    zhName: "设置",
    enName: "Setting",
    icon: setting,
    menus: [
      {
        zhName: "个性化",
        enName: "personalization",
        icon: personalization,
      },
    ],
  },
  {
    zhName: "iMusic",
    enName: "iMusic",
    icon: music,
  },
];

export default appConfig;
