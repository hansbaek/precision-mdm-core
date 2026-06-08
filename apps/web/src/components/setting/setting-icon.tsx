import { SettingsIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const SettingIcon = () => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <SettingsIcon className="text-slate-700  hover:text-orange-600 transition-all cursor-pointer dark:text-white" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Settings Area</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SettingIcon;
