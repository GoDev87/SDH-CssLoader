import {
  ButtonItem,
  PanelSectionRow,
  Focusable,
  TextField,
  DropdownOption,
  Router,
  Dropdown,
  DialogButton,
} from "decky-frontend-lib";
import { useLayoutEffect, useMemo, useState, VFC } from "react";

import { TiRefreshOutline } from "react-icons/ti";

// import "../styles/fullheightcard.css";
import * as python from "../python";

// Interfaces for the JSON objects the lists work with
import { browseThemeEntry } from "../customTypes";
import { useCssLoaderState } from "../state";
import { Theme } from "../theme";
import { AiOutlineDownload } from "react-icons/ai";

export const ThemeBrowserPage: VFC = () => {
  const {
    browseThemeList: themeArr,
    setBrowseThemeList: setThemeArr,
    localThemeList: installedThemes,
    setLocalThemeList: setInstalledThemes,
    searchFieldValue,
    setSearchValue,
    selectedSort,
    setSort,
    selectedTarget,
    setTarget,
    selectedRepo,
    setRepo,
    isInstalling,
    setCurExpandedTheme,
  } = useCssLoaderState();

  const [backendVersion, setBackendVer] = useState<number>(3);
  function reloadBackendVer() {
    python.resolve(python.getBackendVersion(), setBackendVer);
  }

  const searchFilter = (e: browseThemeEntry) => {
    // This means only compatible themes will show up, newer ones won't
    if (e.manifest_version > backendVersion) {
      return false;
    }
    // This filter just implements the search stuff
    if (searchFieldValue.length > 0) {
      // Convert the theme and search to lowercase so that it's not case-sensitive
      if (
        // This checks for the theme name
        !e.name.toLowerCase().includes(searchFieldValue.toLowerCase()) &&
        // This checks for the author name
        !e.author.toLowerCase().includes(searchFieldValue.toLowerCase())
      ) {
        // return false just means it won't show in the list
        return false;
      }
    }
    return true;
  };

  const sortOptions = useMemo(
    (): DropdownOption[] => [
      { data: 1, label: "Alphabetical (A to Z)" },
      { data: 2, label: "Alphabetical (Z to A)" },
      { data: 3, label: "Last Updated (Newest)" },
      { data: 4, label: "Last Updated (Oldest)" },
    ],
    []
  );

  const targetOptions = useMemo((): DropdownOption[] => {
    const uniqueTargets = new Set(
      themeArr.filter(searchFilter).map((e) => e.target)
    );
    return [
      { data: 1, label: "All" },
      { data: 2, label: "Installed" },
      { data: 3, label: "Outdated" },
      ...[...uniqueTargets].map((e, i) => ({ data: i + 4, label: e })),
    ];
  }, [themeArr, searchFilter]);

  const repoOptions = useMemo((): DropdownOption[] => {
    const uniqueRepos = new Set(themeArr.map((e) => e.repo));
    // Spread operator is to turn set into array
    if ([...uniqueRepos].length <= 1) {
      // This says All but really is just official
      return [{ data: 1, label: "All" }];
    } else {
      return [
        { data: 1, label: "All" },
        { data: 2, label: "Official" },
        { data: 3, label: "3rd Party" },
      ];
    }
  }, [themeArr]);

  function reloadThemes() {
    reloadBackendVer();
    reloadThemeDb();
    // Reloads the local themes
    python.resolve(python.reset(), () => {
      python.resolve(python.getThemes(), setInstalledThemes);
    });
  }

  function reloadThemeDb() {
    python.resolve(python.reloadThemeDbData(), () => {
      python.resolve(python.getThemeDbData(), setThemeArr);
    });
  }

  function getInstalledThemes() {
    python.resolve(python.getThemes(), setInstalledThemes);
  }

  function checkIfThemeInstalled(themeObj: browseThemeEntry) {
    const filteredArr: Theme[] = installedThemes.filter(
      (e: Theme) =>
        e.data.name === themeObj.name && e.data.author === themeObj.author
    );
    if (filteredArr.length > 0) {
      if (filteredArr[0].data.version === themeObj.version) {
        return "installed";
      } else {
        return "outdated";
      }
    } else {
      return "uninstalled";
    }
  }

  // Runs upon opening the page every time
  useLayoutEffect(() => {
    reloadBackendVer();
    reloadThemeDb();
    getInstalledThemes();
  }, []);

  return (
    <>
      <PanelSectionRow>
        <Focusable style={{ display: "flex", maxWidth: "100%" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: repoOptions.length <= 1 ? "40%" : "33%",
              minWidth: repoOptions.length <= 1 ? "40%" : "33%",
            }}
          >
            <span>Sort</span>
            <Dropdown
              menuLabel="Sort"
              rgOptions={sortOptions}
              strDefaultLabel="Last Updated (Newest)"
              selectedOption={selectedSort}
              onChange={(e) => setSort(e.data)}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: repoOptions.length <= 1 ? "40%" : "33%",
              minWidth: repoOptions.length <= 1 ? "40%" : "33%",
              marginLeft: "auto",
            }}
          >
            <span>Filter</span>
            <Dropdown
              menuLabel="Filter"
              rgOptions={targetOptions}
              strDefaultLabel="All"
              selectedOption={selectedTarget.data}
              onChange={(e) => setTarget(e)}
            />
          </div>
          {repoOptions.length > 1 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "30%",
                minWidth: "30%",
                marginLeft: "auto",
              }}
            >
              <span>Repo</span>
              <Dropdown
                menuLabel="Filter"
                rgOptions={repoOptions}
                strDefaultLabel="Official"
                selectedOption={selectedRepo.data}
                onChange={(e) => setRepo(e)}
              />
            </div>
          )}
        </Focusable>
      </PanelSectionRow>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Focusable
          style={{ display: "flex", alignItems: "center", width: "96%" }}
        >
          <div style={{ minWidth: "75%" }}>
            <TextField
              label="Search"
              value={searchFieldValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <DialogButton
            onClick={() => {
              reloadThemes();
            }}
            style={{ maxWidth: "20%", marginLeft: "auto", height: "50%" }}
          >
            <TiRefreshOutline style={{ transform: "translate(0, 2px)" }} />
            <span>Refresh</span>
          </DialogButton>
        </Focusable>
      </div>
      {/* I wrap everything in a Focusable, because that ensures that the dpad/stick navigation works correctly */}
      {/* The margin here is there because the card items themselves dont have margin left */}
      <Focusable
        style={{ display: "flex", flexWrap: "wrap", marginLeft: "7.5px" }}
      >
        {themeArr
          // searchFilter also includes backend version check
          .filter(searchFilter)
          .filter((e: browseThemeEntry) => {
            if (selectedTarget.label === "All") {
              return e.target !== "Background";
            } else if (selectedTarget.label === "Installed") {
              const strValue = checkIfThemeInstalled(e);
              return strValue === "installed" || strValue === "outdated";
            } else if (selectedTarget.label === "Outdated") {
              const strValue = checkIfThemeInstalled(e);
              return strValue === "outdated";
            } else {
              return e.target === selectedTarget.label;
            }
          })
          .filter((e: browseThemeEntry) => {
            if (selectedRepo.label === "All") {
              return true;
            } else if (selectedRepo.label === "Official") {
              return e.repo === "Official";
            } else {
              return e.repo !== "Official";
            }
          })
          .sort((a, b) => {
            // This handles the sort option the user has chosen
            switch (selectedSort) {
              case 2:
                // Z-A
                // localeCompare just sorts alphabetically
                return b.name.localeCompare(a.name);
              case 3:
                // New-Old
                return (
                  new Date(b.last_changed).valueOf() -
                  new Date(a.last_changed).valueOf()
                );
              case 4:
                // Old-New
                return (
                  new Date(a.last_changed).valueOf() -
                  new Date(b.last_changed).valueOf()
                );
              default:
                // This is just A-Z
                return a.name.localeCompare(b.name);
            }
          })
          .map((e: browseThemeEntry) => {
            const installStatus = checkIfThemeInstalled(e);
            return (
              // The outer 2 most divs are the background darkened/blurred image, and everything inside is the text/image/buttons
              <>
                <div style={{ position: "relative" }}>
                  {installStatus === "outdated" && (
                    <div
                      className="CssLoader_ThemeBrowser_SingleItem_NotifBubble"
                      style={{
                        position: "absolute",
                        top: "-10px",
                        left: "-10px",
                        padding: "5px 8px 2.5px 8px",
                        background: "linear-gradient(135deg, #3a9bed, #235ecf)",
                        borderRadius: "50%",
                        // The focusRing has a z index of 10000, so this is just to be cheeky
                        zIndex: "10001",
                        boxShadow:
                          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                      }}
                    >
                      <AiOutlineDownload />
                    </div>
                  )}
                  <Focusable
                    focusWithinClassName="gpfocuswithin"
                    onActivate={() => {
                      setCurExpandedTheme(e);
                      Router.Navigate("/theme-manager-expanded-view");
                    }}
                    className="CssLoader_ThemeBrowser_SingleItem_BgImage"
                    style={{
                      backgroundImage: 'url("' + e.preview_image + '")',
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      width: "260px",
                      borderRadius: "5px",
                      marginLeft: "0px",
                      marginRight: "5px",
                      marginBottom: "5px",
                    }}
                  >
                    <div
                      className="CssLoader_ThemeBrowser_SingleItem_BgOverlay"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        background: "RGBA(0,0,0,0.8)",
                        backdropFilter: "blur(5px)",
                        width: "100%",
                        height: "100%",
                        borderRadius: "3px",
                      }}
                    >
                      <span
                        className="CssLoader_ThemeBrowser_SingleItem_ThemeName"
                        style={{
                          textAlign: "center",
                          marginTop: "5px",
                          fontSize: "1.25em",
                          fontWeight: "bold",
                          // This stuff here truncates it if it's too long
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "90%",
                        }}
                      >
                        {e.name}
                      </span>
                      <span
                        className="CssLoader_ThemeBrowser_SingleItem_ThemeTarget"
                        style={{
                          marginTop: "-6px",
                          fontSize: "1em",
                          textShadow: "rgb(48, 48, 48) 0px 0 10px",
                        }}
                      >
                        {e.target}
                      </span>
                      <div
                        className="CssLoader_ThemeBrowser_SingleItem_PreviewImage"
                        style={{
                          width: "240px",
                          backgroundImage: 'url("' + e.preview_image + '")',
                          backgroundSize: "cover",
                          backgroundRepeat: "no-repeat",
                          height: "150px",
                          display: "flex",
                          position: "relative",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      />
                      <div
                        className="CssLoader_ThemeBrowser_SingleItem_AuthorVersionContainer"
                        style={{
                          width: "240px",
                          textAlign: "center",
                          display: "flex",
                          paddingBottom: "8px",
                        }}
                      >
                        <span
                          className="CssLoader_ThemeBrowser_SingleItem_AuthorText"
                          style={{
                            marginRight: "auto",
                            marginLeft: "2px",
                            fontSize: "1em",
                            textShadow: "rgb(48, 48, 48) 0px 0 10px",
                          }}
                        >
                          {e.author}
                        </span>
                        <span
                          className="CssLoader_ThemeBrowser_SingleItem_VersionText"
                          style={{
                            marginLeft: "auto",
                            marginRight: "2px",
                            fontSize: "1em",
                            textShadow: "rgb(48, 48, 48) 0px 0 10px",
                          }}
                        >
                          {e.version}
                        </span>
                      </div>
                    </div>
                  </Focusable>
                </div>
              </>
            );
          })}
      </Focusable>
    </>
  );
};
