import React, { useState, useMemo } from "react";
import {
  Popover,
  Button,
  TextField,
  InputGroup,
  Label,
  Tooltip,
  Slider,
  Tabs,
  ScrollShadow,
  ColorSlider,
  Typography,
  parseColor,
  Color,
} from "@heroui/react";
import {
  Palette,
  Link as LinkIcon,
  Trash2,
  Image as ImageIcon,
  Layers,
  Tag,
  Pencil,
  Check,
  Sliders,
  Move,
  RotateCcw,
  Image,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import {
  PRESET_BACKGROUNDS,
  PRESET_THEME_COLORS,
  DEFAULT_HUE,
  DEFAULT_CHROMA,
  DEFAULT_LIGHTNESS,
} from "@/config/themes";

export function ThemePopover() {
  const {
    activeBackground,
    customBackgrounds,
    selectBackground,
    addCustomBackground,
    renameCustomBackground,
    removeCustomBackground,
    moveCustomBackground,
    overlayOpacity,
    setOverlayOpacity,
    blur,
    setBlur,
    positionX,
    positionY,
    setPositionX,
    setPositionY,
    zoom,
    setZoom,
    hue,
    setAppThemeColor,
  } = useTheme();

  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [activeTab, setActiveTab] = useState<string>("gallery");

  const currentColor = useMemo(() => {
    try {
      return parseColor(`hsl(${hue}, 100%, 50%)`);
    } catch {
      return parseColor("hsl(291, 100%, 50%)");
    }
  }, [hue]);

  const handleColorChange = (newColor: Color) => {
    const newHue = Math.round(newColor.getChannelValue("hue"));

    setAppThemeColor(newHue);
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageUrl.trim()) return;

    const success = addCustomBackground(imageName, imageUrl);

    if (success) {
      setImageUrl("");
      setImageName("");
    }
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      renameCustomBackground(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleRecenter = () => {
    setPositionX(50);
    setPositionY(50);
    setZoom(100);
  };

  return (
    <Popover>
      <Popover.Trigger>
        <Button
          isIconOnly
          aria-label="Wallpapers & Themes"
          className="size-9 md:size-10 rounded-2xl bg-surface/80 hover:bg-surface border border-separator/40 hover:border-separator/80 text-foreground transition-[background-color,border-color] duration-200 cursor-pointer shadow-2xs"
          size="md"
          variant="ghost"
        >
          <Palette className="size-4 md:size-5" />
        </Button>
      </Popover.Trigger>

      <Popover.Content
        className="w-90 sm:w-105 p-4 rounded-3xl bg-surface/95 backdrop-blur-2xl border border-separator/80 shadow-2xl z-90"
        placement="bottom start"
      >
        <Popover.Dialog className="space-y-3.5 outline-none">
          {/* Header & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="p-1.5 rounded-xl bg-surface-secondary transition-colors"
                style={{
                  color: `oklch(${DEFAULT_LIGHTNESS}% ${DEFAULT_CHROMA} ${hue})`,
                }}
              >
                <Palette className="size-4" />
              </span>
              <div>
                <Typography
                  className="text-sm text-foreground"
                  type="h3"
                  weight="bold"
                >
                  Appearance
                </Typography>
                <Typography
                  className="text-[11px]"
                  color="muted"
                  type="body-xs"
                >
                  {activeBackground ? activeBackground.name : "Clean Slate"}
                </Typography>
              </div>
            </div>
          </div>

          {/* 2 Navigation Tabs: Wallpapers & Fine Tuning */}
          <Tabs
            className="w-full"
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tabs.ListContainer className="rounded-full">
              <Tabs.List
                aria-label="Appearance Navigation"
                className="rounded-full bg-surface-secondary/70 p-0.5 sm:p-1 border-separator/30 text-xs"
              >
                <Tabs.Tab
                  className="h-7 px-3 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  id="gallery"
                >
                  <ImageIcon className="size-3.5" />
                  <span>Wallpapers</span>
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>

                <Tabs.Tab
                  className="h-7 px-3 rounded-full text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  id="adjust"
                >
                  <Sliders className="size-3.5" />
                  <span>Fine Tuning</span>
                  <Tabs.Indicator className="rounded-full bg-accent text-accent-foreground" />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Tab 1: Wallpapers Gallery & Custom Add */}
            <Tabs.Panel className="space-y-3 pt-2" id="gallery">
              {/* Add Custom Wallpaper via Link & Name */}
              <form
                className="p-2.5 bg-surface-secondary/70 rounded-2xl border border-separator/60 space-y-2"
                onSubmit={handleAddCustom}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Image className="size-3.5 text-accent" />
                  <span>Add Image Link</span>
                </div>

                <div className="space-y-1.5">
                  <TextField
                    fullWidth
                    aria-label="Wallpaper name"
                    name="imageName"
                    value={imageName}
                    onChange={setImageName}
                  >
                    <InputGroup fullWidth>
                      <InputGroup.Prefix>
                        <Tag className="size-3.5 text-muted" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        className="text-xs"
                        placeholder="Name (optional)"
                      />
                    </InputGroup>
                  </TextField>

                  <div className="flex gap-1.5">
                    <TextField
                      fullWidth
                      aria-label="Wallpaper image URL"
                      name="imageUrl"
                      value={imageUrl}
                      onChange={setImageUrl}
                    >
                      <InputGroup fullWidth>
                        <InputGroup.Prefix>
                          <LinkIcon className="size-3.5 text-muted" />
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          className="text-xs"
                          placeholder="Paste image URL (https://...)"
                          type="url"
                        />
                      </InputGroup>
                    </TextField>

                    <Button
                      className="shrink-0 font-medium px-3 text-xs"
                      isDisabled={!imageUrl.trim()}
                      size="sm"
                      type="submit"
                      variant="primary"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </form>

              {/* Gallery Grid */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted px-0.5">
                  <span>Presets & Custom</span>
                  <span className="text-[10px]">
                    {PRESET_BACKGROUNDS.length + customBackgrounds.length} total
                  </span>
                </div>

                <ScrollShadow className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2">
                  {/* Clean Slate Minimal Option */}
                  <button
                    className={`group relative rounded-xl aspect-16/11 p-2 text-left flex flex-col justify-between transition-colors border cursor-pointer overflow-hidden ${
                      activeBackground === null
                        ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background shadow-md shadow-accent/20 bg-surface"
                        : "border-separator/80 hover:border-muted bg-surface-secondary/70"
                    }`}
                    type="button"
                    onClick={() => selectBackground(null)}
                  >
                    <div className="flex items-center justify-between">
                      <Layers className="size-3.5 text-muted group-hover:text-foreground transition-colors" />
                    </div>
                    <span className="text-[10px] font-medium text-foreground truncate">
                      Clean Slate
                    </span>
                  </button>

                  {/* Preset Wallpapers */}
                  {PRESET_BACKGROUNDS.map((bg) => {
                    const isSelected = activeBackground?.id === bg.id;

                    return (
                      <button
                        key={bg.id}
                        className={`group relative rounded-xl aspect-16/11 p-2 text-left flex flex-col justify-between transition-[border-color,transform] border cursor-pointer overflow-hidden bg-cover bg-center ${
                          isSelected
                            ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background shadow-md shadow-accent/20 scale-[1.02]"
                            : "border-separator/80 hover:border-muted hover:scale-[1.02]"
                        }`}
                        style={{ backgroundImage: `url(${bg.url})` }}
                        type="button"
                        onClick={() => selectBackground(bg)}
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10 group-hover:opacity-85 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <ImageIcon className="size-3 text-white/80" />
                        </div>
                        <span className="relative z-10 text-[10px] font-medium text-white truncate drop-shadow-sm">
                          {bg.name}
                        </span>
                      </button>
                    );
                  })}

                  {/* Custom Wallpapers */}
                  {customBackgrounds.map((bg) => {
                    const isSelected = activeBackground?.id === bg.id;
                    const isEditing = editingId === bg.id;

                    return (
                      <div
                        key={bg.id}
                        className={`group relative rounded-xl aspect-16/11 p-2 text-left flex flex-col justify-between transition-[border-color,transform] border overflow-hidden bg-cover bg-center cursor-pointer ${
                          isSelected
                            ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background shadow-md shadow-accent/20 scale-[1.02]"
                            : "border-separator/80 hover:border-muted hover:scale-[1.02]"
                        }`}
                        role="button"
                        style={{ backgroundImage: `url(${bg.url})` }}
                        tabIndex={0}
                        onClick={() => {
                          if (!isEditing) selectBackground(bg);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            if (!isEditing) selectBackground(bg);
                          }
                        }}
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10 group-hover:opacity-85 transition-opacity" />

                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className="text-[8px] px-1 py-0.5 rounded bg-black/60 text-white/90">
                            Custom
                          </span>

                          <div
                            className="flex items-center gap-1"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            {/* Move Left */}
                            <Tooltip delay={150}>
                              <Tooltip.Trigger>
                                <button
                                  aria-label="Move left"
                                  className="size-4.5 rounded-full bg-black/70 hover:bg-surface text-white flex items-center justify-center cursor-pointer transition-colors"
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    moveCustomBackground(bg.id, "left");
                                  }}
                                >
                                  <ChevronLeft className="size-2.5" />
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content className="text-xs px-2 py-0.5 rounded-lg bg-surface border border-separator shadow-md">
                                Move Left
                              </Tooltip.Content>
                            </Tooltip>

                            {/* Move Right */}
                            <Tooltip delay={150}>
                              <Tooltip.Trigger>
                                <button
                                  aria-label="Move right"
                                  className="size-4.5 rounded-full bg-black/70 hover:bg-surface text-white flex items-center justify-center cursor-pointer transition-colors"
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    moveCustomBackground(bg.id, "right");
                                  }}
                                >
                                  <ChevronRight className="size-2.5" />
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content className="text-xs px-2 py-0.5 rounded-lg bg-surface border border-separator shadow-md">
                                Move Right
                              </Tooltip.Content>
                            </Tooltip>

                            {/* Rename toggle button */}
                            <Tooltip delay={150}>
                              <Tooltip.Trigger>
                                <button
                                  aria-label={
                                    isEditing
                                      ? `Save ${bg.name}`
                                      : `Rename ${bg.name}`
                                  }
                                  className={`size-4.5 rounded-full text-white flex items-center justify-center cursor-pointer transition-colors ${
                                    isEditing
                                      ? "bg-accent text-accent-foreground"
                                      : "bg-black/70 hover:bg-surface"
                                  }`}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isEditing) {
                                      handleSaveRename(bg.id);
                                    } else {
                                      setEditingId(bg.id);
                                      setEditingName(bg.name);
                                    }
                                  }}
                                >
                                  {isEditing ? (
                                    <Check className="size-2.5" />
                                  ) : (
                                    <Pencil className="size-2.5" />
                                  )}
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content className="text-xs px-2 py-0.5 rounded-lg bg-surface border border-separator shadow-md">
                                {isEditing ? "Save Name" : "Rename"}
                              </Tooltip.Content>
                            </Tooltip>

                            {/* Delete button */}
                            <Tooltip delay={150}>
                              <Tooltip.Trigger>
                                <button
                                  aria-label={`Delete ${bg.name}`}
                                  className="size-4.5 rounded-full bg-black/70 hover:bg-danger text-white flex items-center justify-center cursor-pointer transition-colors"
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeCustomBackground(bg.id);
                                  }}
                                >
                                  <Trash2 className="size-2.5" />
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Content className="text-xs px-2 py-0.5 rounded-lg bg-surface border border-separator shadow-md">
                                Delete
                              </Tooltip.Content>
                            </Tooltip>
                          </div>
                        </div>

                        {isEditing ? (
                          <div
                            className="relative z-20"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <input
                              className="text-[10px] font-medium text-foreground bg-surface px-1 py-0.5 rounded border border-accent w-full outline-none"
                              value={editingName}
                              onBlur={() => handleSaveRename(bg.id)}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(bg.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <span className="relative z-10 text-[10px] font-medium text-white truncate drop-shadow-sm w-full block">
                            {bg.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </ScrollShadow>
              </div>
            </Tabs.Panel>

            {/* Tab 2: Fine Tuning & HeroUI ColorSlider */}
            <Tabs.Panel className="space-y-3 pt-2" id="adjust">
              <div className="p-3 bg-surface-secondary/50 rounded-2xl border border-separator/60 space-y-3.5">
                {/* Theme Color Section with HeroUI ColorSlider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-separator/40">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-3 rounded-full shadow-xs border border-white/20"
                        style={{
                          backgroundColor: `oklch(${DEFAULT_LIGHTNESS}% ${DEFAULT_CHROMA} ${hue})`,
                        }}
                      />
                      <span className="text-[11px] font-bold text-muted/80 r uppercase">
                        Theme Color
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => setAppThemeColor(DEFAULT_HUE)}
                    >
                      <RotateCcw className="size-3" />
                      Default
                    </Button>
                  </div>

                  {/* HeroUI ColorSlider */}
                  <ColorSlider
                    aria-label="App Theme Hue"
                    channel="hue"
                    value={currentColor}
                    onChange={handleColorChange}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <Label className="text-muted font-medium">Hue</Label>
                      <ColorSlider.Output />
                    </div>
                    <ColorSlider.Track>
                      <ColorSlider.Thumb />
                    </ColorSlider.Track>
                  </ColorSlider>

                  {/* Preset Quick Vibe Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {PRESET_THEME_COLORS.map((preset) => {
                      const isSelected = hue === preset.hue;

                      return (
                        <button
                          key={preset.name}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-[background-color,border-color,color,transform] border flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? "bg-surface text-foreground border-accent shadow-xs scale-105"
                              : "bg-surface-secondary/70 text-muted border-separator/60 hover:text-foreground hover:border-muted hover:scale-102"
                          }`}
                          type="button"
                          onClick={() => setAppThemeColor(preset.hue)}
                        >
                          <span
                            className="size-2 rounded-full shadow-2xs"
                            style={{
                              backgroundColor: `oklch(${DEFAULT_LIGHTNESS}% ${DEFAULT_CHROMA} ${preset.hue})`,
                            }}
                          />
                          <span>{preset.name.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Background Position & Scale (if wallpaper active) */}
                {activeBackground && (
                  <>
                    <div className="flex items-center justify-between pt-2 pb-1 border-t border-b border-separator/40">
                      <span className="text-[11px] font-bold text-muted/80 r uppercase">
                        Position & Scale
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={handleRecenter}
                      >
                        <Move className="size-3" />
                        Re-center
                      </Button>
                    </div>

                    {/* Wallpaper Zoom Slider */}
                    <Slider
                      aria-label="Wallpaper Zoom / Scale"
                      className="w-full"
                      maxValue={200}
                      minValue={100}
                      step={0.5}
                      value={zoom}
                      onChange={(val) =>
                        setZoom(typeof val === "number" ? val : val[0])
                      }
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <Label className="text-muted font-medium">
                          Zoom / Scale
                        </Label>
                        <Slider.Output className="font-semibold text-foreground text-[10px]">
                          {({ state }) =>
                            `${Math.round(state.values[0] - 100)}%`
                          }
                        </Slider.Output>
                      </div>
                      <Slider.Track>
                        <Slider.Fill />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>

                    {/* Horizontal Shift Slider (X) */}
                    <Slider
                      aria-label="Wallpaper Horizontal Shift"
                      className="w-full"
                      maxValue={100}
                      minValue={0}
                      value={positionX}
                      onChange={(val) =>
                        setPositionX(typeof val === "number" ? val : val[0])
                      }
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <Label className="text-muted font-medium">
                          Horizontal Shift (X)
                        </Label>
                        <Slider.Output className="font-semibold text-foreground text-[10px]">
                          {({ state }) => `${state.values[0]}%`}
                        </Slider.Output>
                      </div>
                      <Slider.Track>
                        <Slider.Fill />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>

                    {/* Vertical Shift Slider (Y) */}
                    <Slider
                      aria-label="Wallpaper Vertical Shift"
                      className="w-full"
                      maxValue={100}
                      minValue={0}
                      value={positionY}
                      onChange={(val) =>
                        setPositionY(typeof val === "number" ? val : val[0])
                      }
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <Label className="text-muted font-medium">
                          Vertical Shift (Y)
                        </Label>
                        <Slider.Output className="font-semibold text-foreground text-[10px]">
                          {({ state }) => `${state.values[0]}%`}
                        </Slider.Output>
                      </div>
                      <Slider.Track>
                        <Slider.Fill />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>

                    <div className="pt-2 border-t border-separator/40 space-y-3">
                      <span className="text-[11px] font-bold text-muted/80 r uppercase block">
                        Dimming & Blur
                      </span>

                      {/* Dimming Slider */}
                      <Slider
                        aria-label="Wallpaper Dimming"
                        className="w-full"
                        maxValue={85}
                        minValue={10}
                        value={overlayOpacity}
                        onChange={(val) =>
                          setOverlayOpacity(
                            typeof val === "number" ? val : val[0],
                          )
                        }
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <Label className="text-muted font-medium">
                            Wallpaper Dimming
                          </Label>
                          <Slider.Output className="font-semibold text-foreground text-[10px]">
                            {({ state }) => `${state.values[0]}%`}
                          </Slider.Output>
                        </div>
                        <Slider.Track>
                          <Slider.Fill />
                          <Slider.Thumb />
                        </Slider.Track>
                      </Slider>

                      {/* Soft Blur Slider */}
                      <Slider
                        aria-label="Wallpaper Soft Blur"
                        className="w-full"
                        maxValue={20}
                        minValue={0}
                        step={0.1}
                        value={blur}
                        onChange={(val) =>
                          setBlur(typeof val === "number" ? val : val[0])
                        }
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <Label className="text-muted font-medium">
                            Soft Blur
                          </Label>
                          <Slider.Output className="font-semibold text-foreground text-[10px]">
                            {({ state }) =>
                              `${Math.round((state.values[0] / 20) * 100)}%`
                            }
                          </Slider.Output>
                        </div>
                        <Slider.Track>
                          <Slider.Fill />
                          <Slider.Thumb />
                        </Slider.Track>
                      </Slider>
                    </div>
                  </>
                )}
              </div>
            </Tabs.Panel>
          </Tabs>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
