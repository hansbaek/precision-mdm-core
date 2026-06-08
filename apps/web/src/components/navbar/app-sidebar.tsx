/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  FolderClosedIcon,
  InfoIcon,
  LinkIcon,
  ListOrderedIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "usehooks-ts";

import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const { open } = useSidebar();

  const [expanded, setExpanded] = useLocalStorage<Record<string, any>>(
    "dii-boilerplate-sidebar-state",
    {},
  );

  const [activeMenu, setActiveMenu] = React.useState("");

  const defaultAccordionValue: string[] = Object.keys(expanded).reduce(
    (acc: string[], key: string) => {
      if (expanded[key]) {
        acc.push(key);
      }
      return acc;
    },
    [],
  );

  const onExpand = (id: string) => {
    setActiveMenu(id);
    setExpanded((curr) => ({
      ...curr,
      [id]: !expanded[id],
    })); // 현재 펼쳐진 상태면 닫고, 닫힌 상태면 펼치도록 설정
  };

  const onClickItem = (href: string) => {
    navigate(href);
  };

  interface NavCategory {
    id: string;
    label: string;
    menus: MenuItem[];
  }

  interface MenuItem {
    id: string;
    label: string;
    icon?: React.ReactElement;
    href: string;
    subMenus: SubMenuItem[];
  }

  interface SubMenuItem {
    label: string;
    href: string;
    icon?: React.ReactElement;
  }

  const navCategories: NavCategory[] = [
    {
      id: "samples",
      label: "Samples",
      menus: [
        {
          id: "sample1",
          label: t("navItem.sample1"),
          href: "#",
          icon: <FolderClosedIcon />,
          subMenus: [
            {
              label: t("navItem.sample1Group.item1"),
              icon: <InfoIcon className="h-4 w-4 mr-2" />,
              href: "/sample1/item1",
            },
            {
              label: t("navItem.sample1Group.item2"),
              icon: <LinkIcon className="h-4 w-4 mr-2" />,
              href: "/sample1/item2",
            },
            {
              label: t("navItem.sample1Group.item3"),
              icon: <LinkIcon className="h-4 w-4 mr-2" />,
              href: "/sample1/item3",
            },
          ],
        },
        {
          id: "sample2",
          label: t("navItem.sample2"),
          href: "#",
          icon: <FolderClosedIcon />,
          subMenus: [
            {
              label: t("navItem.sample2Group.item1"),
              icon: <FileTextIcon className="h-4 w-4 mr-2" />,
              href: "/sample2/item1",
            },
            {
              label: t("navItem.sample2Group.item2"),
              icon: <ListOrderedIcon className="h-4 w-4 mr-2" />,
              href: "/sample2/item2",
            },
          ],
        },
      ],
    },
    {
      id: "anotherSample",
      label: "Another Sample",
      menus: [
        {
          id: "anotherSample",
          label: t("navItem.anotherSample"),
          href: "#",
          icon: <FolderClosedIcon />,
          subMenus: [
            {
              label: t("navItem.sample1Group.item1"),
              icon: <InfoIcon className="h-4 w-4 mr-2" />,
              href: "/anotherSample/item1",
            },
            {
              label: t("navItem.sample1Group.item2"),
              icon: <LinkIcon className="h-4 w-4 mr-2" />,
              href: "/anotherSample/item2",
            },
            {
              label: t("navItem.sample1Group.item3"),
              icon: <LinkIcon className="h-4 w-4 mr-2" />,
              href: "/anotherSample/item3",
            },
          ],
        },
      ],
    },
  ];

  return (
    <Sidebar
      {...props}
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarTrigger
        className={cn(
          "fixed top-16 z-50 h-10 w-10 rounded-md border bg-background shadow-md",
          "transition-all duration-300 ease-in-out hover:bg-accent",
          open ? "left-[calc(var(--sidebar-width))]!" : "left-2",
        )}
      />
      <SidebarContent defaultValue={defaultAccordionValue}>
        {navCategories.map((category) => (
          <SidebarGroup key={category.id}>
            <SidebarGroupLabel>{category.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              {category.menus.map((menu) => {
                return (
                  <SidebarMenu key={menu.id}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className={`flex gap-2 ${activeMenu === menu.id ? "bg-orange-200 dark:bg-slate-600" : ""} text-sm`}
                        onClick={() => onExpand(menu.id)}
                      >
                        {expanded[menu.id] ? (
                          <ChevronDownIcon />
                        ) : (
                          <ChevronRightIcon />
                        )}
                        {menu.icon}
                        {menu.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {expanded[menu.id]
                      ? menu.subMenus.map((item) => (
                          <SidebarMenuSubItem key={item.label}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === item.href}
                              onClick={() => onClickItem(item.href)}
                              className={cn(
                                "w-full font-normal justify-start pl-10 mb-1 cursor-pointer text-neutral-700 hover:bg-neutral-500/10 dark:text-white",
                                location.pathname === item.href &&
                                  "bg-orange-500/10 text-orange-500 hover:text-orange-900 hover:bg-orange-50",
                              )}
                            >
                              <div>
                                {item.icon}
                                {item.label}
                              </div>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      : null}
                  </SidebarMenu>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
