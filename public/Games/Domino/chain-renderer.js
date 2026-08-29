/*
 * CHAIN RENDERER AUDIT
 *
 * Reference source studied:
 * - https://dominoes.playdrift.com/singleplayer
 * - Linked assets fetched and read from the page bundle:
 *   index-n7QeoT66.js, index-8uYBpDgg.css, registerSW.js, Game-XdE8kZZh.js,
 *   useGameSingleplayer-5jZ6XNGB.js, game-AYPiYi1I.js, singleplayer-nptiQtOa.js,
 *   Store-7oKGOJsJ.js, plus the dynamic chunks preloaded by the HTML.
 *
 * Reference behavior extracted:
 * - Chain layout uses absolute positioned domino nodes inside a board/layer,
 *   not flex, grid, or canvas. The board itself is transformed and centered.
 * - Single tile DOM is a `.bone` element with absolute left/top at 0 and
 *   transform: translate(x, y) rotate(deg). The tile art is sprite based.
 * - Tile movement transition is exactly transform 450ms ease-in-out 16ms.
 * - Board/layer transition is transform 450ms ease-in-out 16ms and opacity
 *   650ms ease-in 1ms. Yard/hand opacity and transform transitions use 300ms.
 * - Highlight opacity transitions use 120ms ease-in 1ms.
 * - Direction constants are LEFT=0, UP=1, RIGHT=2, DOWN=3. A new tile rejects
 *   opposite direction, then either continues or turns. Normal tiles are long
 *   in the travel direction; doubles are perpendicular. A spinner/fives layout
 *   opens secondary vertical branches from the first double.
 * - The reference scroll behavior is board centering by transform; hand/yard
 *   scrollers clamp to content bounds. This implementation keeps board content
 *   absolute and scrollable/pannable inside the existing chain container.
 *
 * Local current-code audit:
 * - Domino implementation is self-contained in public/Games/Domino/Domino.html
 *   plus public/Games/Domino/Domino.css. src/components/games/domino/
 *   DominoReact.css only frames the iframe.
 * - Board DOM: #dropZone .table-center contains #chain.chain. This is the only
 *   DOM surface touched by the renderer.
 * - Current chain data structure:
 *   chainTiles: ordered main-line tile array, each tile has id, left, right.
 *   leftEnd/rightEnd: current open values from the server.
 *   centerDouble: All Fives spinner tile when the server has selected one.
 *   centerTopTiles/centerBottomTiles: vertical branches off centerDouble.
 *   gameType: "AllFives", "Quick5", or "Classic101".
 * - Current chain rendering functions in Domino.html:
 *   getTileId, getTileOrientation, getPlacementSize, createPlacement,
 *   getSharedTileValue, orientTileToValue, buildMainChainDisplayMap,
 *   buildDirectionalBranchDisplayMap, applyDisplayMapToTile,
 *   getDisplaySideSlots, orientTileToConnector, getConnectorValue,
 *   buildNormalAnchorDisplay, attachNormalBranchRenderTiles,
 *   getDirectionSides, getPlacementConnector, createPlacementFromConnector,
 *   createTurnPlacement, getChainMetrics, setNormalChainAnchor,
 *   buildBranchPlacements, buildNormalChainLayout, getClockwiseNextDirection,
 *   isPlacementWithinMetricsBounds, buildClockwiseTurnPlacement,
 *   createFlowPlacement, buildClockwiseBoundedBranch,
 *   buildAllFivesChainLayout, syncStaticTileElement,
 *   getOrCreateChainNode, animateDominoFlight, animatePlacementFlight,
 *   clearChainNodesExcept, resetChainRenderState, showChainPlaceholder,
 *   animatePlacedNode, reconcileChainNodes, getUniqueTilesById,
 *   getRenderedChainTilesSnapshot, getExplicitPlacedTileIds,
 *   getNewChainTileIds, getPlacementAnimationIds, renderDots, createTile,
 *   setupDropZone, handleTilePlacement, showSideSelector, selectSide,
 *   canPlaceTileOnCenter, canPlaceTile, renderHand, renderChain,
 *   renderChainWithCenter.
 * - renderChain call sites:
 *   showGame, handleViewportChange, rerenderRecoveredDominoRoom,
 *   applyRecoveredFullGameState, GameState socket handler, TilePlaced socket
 *   handler, renderChain retry callbacks, renderChainWithCenter.
 * - Placement state/socket flow is outside this file and is intentionally not
 *   modified. This file accepts the existing data object unchanged and adapts
 *   only the visual board representation.
 */

(function () {
    "use strict";

    const DEFAULT_CONFIG = {
        containerId: "chain",
        mode: "mode3",
        placeholder: "Place first tile",
        moveMs: 450,
        moveDelayMs: 16,
        fadeMs: 300,
        fadeSlowMs: 650,
        highlightMs: 120,
        easing: "ease-in-out"
    };

    const PIP_POSITIONS = {
        0: [],
        1: [5],
        2: [1, 9],
        3: [1, 5, 9],
        4: [1, 3, 7, 9],
        5: [1, 3, 5, 7, 9],
        6: [1, 3, 4, 6, 7, 9]
    };

    const OPPOSITE_DIRECTION = {
        left: "right",
        right: "left",
        up: "down",
        down: "up"
    };

    const state = {
        config: { ...DEFAULT_CONFIG },
        container: null,
        world: null,
        nodes: new Map(),
        guides: [],
        guideLayer: null,
        lastPlacements: [],
        lastMetrics: null,
        lastData: null,
        anchorId: null,
        lastSignature: "",
        pan: null,
        initializedContainers: new WeakSet()
    };

    function initChainRenderer(config = {}) {
        state.config = { ...state.config, ...config };
        state.container = resolveContainer(state.config);
        if (!state.container) return null;

        state.container.classList.add("cr-chain");
        state.container.dataset.crMode = state.config.mode || DEFAULT_CONFIG.mode;
        state.container.style.setProperty("--cr-move-duration", `${state.config.moveMs}ms`);
        state.container.style.setProperty("--cr-move-delay", `${state.config.moveDelayMs}ms`);
        state.container.style.setProperty("--cr-fade-duration", `${state.config.fadeMs}ms`);
        state.container.style.setProperty("--cr-fade-slow-duration", `${state.config.fadeSlowMs}ms`);
        state.container.style.setProperty("--cr-highlight-duration", `${state.config.highlightMs}ms`);
        state.container.style.setProperty("--cr-easing", state.config.easing);

        ensureWorld();
        attachPanBehavior(state.container);
        return api;
    }

    function renderChain(chainData = {}) {
        if (!state.container) initChainRenderer();
        if (!state.container) return;

        ensureWorld();

        const data = adaptChainData(chainData);
        const signature = createSignature(data);

        if (!data.chainTiles.length) {
            state.lastSignature = "";
            state.anchorId = null;
            renderPlaceholder(data.placeholder || state.config.placeholder);
            return;
        }

        const metrics = getMetrics(state.container, getLayoutKind(data));
        const placements = getLayoutKind(data) === "all-fives" && data.centerDouble
            ? buildSpinnerLayout(data, metrics)
            : buildNormalLayout(data, metrics);

        if (!placements.length) {
            renderPlaceholder(data.placeholder || state.config.placeholder);
            state.lastSignature = signature;
            return;
        }

        paintPlacements(placements, data, metrics);
        state.lastSignature = signature;
    }

    function animateTilePlacement(tile, position = {}) {
        if (!state.container) initChainRenderer();
        if (!state.container) return Promise.resolve();

        if (position.invalid) {
            playInvalidFeedback(tile);
            return Promise.resolve();
        }

        return playFlight(tile, position);
    }

    function showPlacementGuide(tile, options = {}) {
        if (!state.container) initChainRenderer();
        if (!state.container || !state.world) return;

        hidePlacementGuide({ immediate: true });

        const sides = Array.isArray(options.sides)
            ? options.sides.filter(Boolean)
            : [];

        if (!sides.length) return;

        const metrics = state.lastMetrics || getMetrics(state.container, "classic");
        const layer = ensureGuideLayer();
        const guides = sides
            .map(side => createGuideDescriptor(side, tile, metrics))
            .filter(Boolean);

        expandWorldForGuides(guides, metrics);

        guides.forEach((guide) => {
            const marker = document.createElement("div");
            marker.className = [
                "cr-placement-guide",
                `cr-guide-${guide.side}`,
                `cr-orient-${guide.orientation || "vertical"}`,
                `cr-rot-${normalizeRotation(guide.rotation || 0)}`
            ].join(" ");
            marker.dataset.side = guide.side;
            marker.style.width = `${guide.width}px`;
            marker.style.height = `${guide.height}px`;
            marker.style.transform = `translate3d(${guide.x}px, ${guide.y}px, 0)`;
            marker.style.setProperty("--cr-legacy-scale", String(guide.scale || metrics.scale));
            marker.appendChild(createDominoElement(guide.renderTile || tile, {
                ...guide,
                isSpinner: false,
                orientation: guide.orientation || "vertical"
            }));
            layer.appendChild(marker);
            guide.el = marker;
        });

        state.guides = guides;
        if (guides.length === 1) selectGuide(guides[0]);
    }

    function updatePlacementGuide(clientX, clientY) {
        if (!state.container || !state.guides.length) return null;

        autoPanDuringDrag(clientX, clientY);

        const rect = state.container.getBoundingClientRect();
        const worldX = clientX - rect.left + state.container.scrollLeft;
        const worldY = clientY - rect.top + state.container.scrollTop;
        let best = null;
        let bestDistance = Infinity;

        state.guides.forEach((guide) => {
            const dx = guide.centerX - worldX;
            const dy = guide.centerY - worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bestDistance) {
                best = guide;
                bestDistance = distance;
            }
        });

        selectGuide(best || (state.guides.length === 1 ? state.guides[0] : null));
        return getSelectedPlacementSide();
    }

    function getSelectedPlacementSide() {
        const selected = state.guides.find(guide => guide.selected);
        return selected ? selected.side : null;
    }

    function hidePlacementGuide(options = {}) {
        const immediate = !!options.immediate;
        state.guides.forEach((guide) => {
            if (!guide.el) return;

            if (immediate) {
                guide.el.remove();
                return;
            }

            guide.el.classList.add("cr-guide-hide");
            guide.el.addEventListener("animationend", () => {
                guide.el?.remove();
            }, { once: true });
        });

        state.guides = [];

        if (immediate && state.guideLayer) {
            state.guideLayer.replaceChildren();
        }

        if (!immediate) restoreWorldSize();
    }

    function clearChain() {
        if (state.world) {
            state.world.replaceChildren();
            state.world.remove();
        }

        state.world = null;
        state.nodes.clear();
        state.guides = [];
        state.guideLayer = null;
        state.lastPlacements = [];
        state.lastMetrics = null;
        state.lastData = null;
        state.anchorId = null;
        state.lastSignature = "";

        if (state.container) {
            state.container.classList.remove("cr-chain");
            state.container.removeAttribute("data-cr-mode");
        }
    }

    function resolveContainer(config) {
        if (config.container instanceof HTMLElement) return config.container;
        return document.getElementById(config.containerId || DEFAULT_CONFIG.containerId);
    }

    function ensureWorld() {
        if (!state.container) return null;

        const existing = state.container.querySelector(":scope > .cr-world");
        if (existing) {
            state.world = existing;
            return state.world;
        }

        state.container.replaceChildren();
        state.world = document.createElement("div");
        state.world.className = "cr-world";
        state.container.appendChild(state.world);
        return state.world;
    }

    function renderPlaceholder(message) {
        const world = ensureWorld();
        if (!world) return;

        state.nodes.clear();
        world.replaceChildren();
        world.style.width = "100%";
        world.style.height = "100%";

        const placeholder = document.createElement("div");
        placeholder.className = "cr-empty";
        placeholder.textContent = message || DEFAULT_CONFIG.placeholder;
        world.appendChild(placeholder);
    }

    function adaptChainData(chainData) {
        const source = Array.isArray(chainData) ? { chainTiles: chainData } : (chainData || {});
        return {
            chainTiles: normalizeTiles(source.chainTiles || source.allChainTiles || source.tiles || []),
            centerDouble: normalizeTile(source.centerDouble),
            centerTopTiles: normalizeTiles(source.centerTopTiles || source.topTiles || []),
            centerBottomTiles: normalizeTiles(source.centerBottomTiles || source.bottomTiles || []),
            gameType: source.gameType || "",
            leftEnd: source.leftEnd,
            rightEnd: source.rightEnd,
            animateNewIds: source.animateNewIds instanceof Set
                ? source.animateNewIds
                : new Set(source.animateNewIds || []),
            placedBy: source.placedBy || "",
            placeholder: source.placeholder || ""
        };
    }

    function normalizeTiles(tiles) {
        return Array.isArray(tiles)
            ? tiles.map(normalizeTile).filter(Boolean)
            : [];
    }

    function normalizeTile(tile) {
        if (!tile) return null;

        const left = Number(tile.left ?? tile.Left ?? tile.a ?? tile.first ?? tile.renderLeft ?? 0);
        const right = Number(tile.right ?? tile.Right ?? tile.b ?? tile.second ?? tile.renderRight ?? 0);

        return {
            ...tile,
            id: tile.id ?? tile.Id ?? `${left}-${right}-${Math.random().toString(36).slice(2)}`,
            left,
            right,
            renderLeft: tile.renderLeft,
            renderRight: tile.renderRight
        };
    }

    function createSignature(data) {
        return [
            state.config.mode,
            data.gameType,
            data.chainTiles.map(getTileId).join("|"),
            data.centerDouble ? getTileId(data.centerDouble) : "",
            data.centerTopTiles.map(getTileId).join("|"),
            data.centerBottomTiles.map(getTileId).join("|")
        ].join("::");
    }

    function getLayoutKind(data) {
        if (state.config.mode === "mode1" || data.gameType === "AllFives") return "all-fives";
        if (state.config.mode === "mode2" || data.gameType === "Quick5") return "quick";
        return "classic";
    }

    function getMetrics(container, kind) {
        const viewportWidth = Math.max(container.clientWidth || 0, 320);
        const viewportHeight = Math.max(container.clientHeight || 0, 160);
        const compact = viewportWidth < 560 || viewportHeight < 230;
        const fit = Math.min(viewportWidth / 860, viewportHeight / 390);
        const minScale = compact ? 0.42 : (kind === "all-fives" ? 0.5 : 0.52);
        const maxScale = compact ? 0.58 : (kind === "quick" ? 0.74 : 0.72);
        const scale = clamp(fit || (compact ? 0.5 : 0.64), minScale, maxScale);
        const shortSide = Math.round(35 * scale);
        const longSide = Math.round(70 * scale);
        const gap = 0;
        const turnGap = Math.max(1, Math.round(2 * scale));
        const padding = compact
            ? longSide + 2
            : Math.max(longSide + 4, Math.round(Math.min(viewportWidth, viewportHeight) * 0.08));
        const horizontalCapacity = Math.max(3, Math.floor((viewportWidth / 2 - padding) / (longSide + gap)));
        const verticalCapacity = Math.max(2, Math.floor((viewportHeight / 2 - padding) / (longSide + gap)));

        return {
            viewportWidth,
            viewportHeight,
            scale,
            shortSide,
            longSide,
            gap,
            turnGap,
            padding,
            horizontalCapacity,
            verticalCapacity,
            primaryCapacity: kind === "all-fives"
                ? Math.max(2, horizontalCapacity - 1)
                : horizontalCapacity
        };
    }

    function buildNormalLayout(data, metrics) {
        const tiles = data.chainTiles;
        if (!tiles.length) return [];

        const anchorIndex = chooseAnchorIndex(tiles);
        const anchorTile = tiles[anchorIndex];
        const anchorDisplayMap = buildMainDisplayMap(tiles);
        const anchorDisplay = anchorDisplayMap.get(getTileId(anchorTile)) || tileDisplay(anchorTile);
        const anchorPlacement = createBasePlacement(anchorTile, "horizontal", 0, 0, metrics, {
            branch: "main",
            direction: "right",
            renderTile: withDisplay(anchorTile, anchorDisplay),
            isAnchor: true
        });

        if (isDouble(anchorTile)) {
            anchorPlacement.orientation = "vertical";
            applySize(anchorPlacement, metrics);
            anchorPlacement.rotation = getRotationForDirection(anchorPlacement.direction, anchorPlacement.orientation);
        }

        const placements = [anchorPlacement];
        const leftTiles = tiles.slice(0, anchorIndex).reverse();
        const rightTiles = tiles.slice(anchorIndex + 1);

        const leftValue = anchorDisplay.first;
        const rightValue = anchorDisplay.second;

        placements.push(...buildBranch({
            tiles: leftTiles,
            startPlacement: anchorPlacement,
            startValue: leftValue,
            initialDirection: "left",
            turnSign: -1,
            metrics,
            branch: "left",
            displaySide: "second"
        }));

        placements.push(...buildBranch({
            tiles: rightTiles,
            startPlacement: anchorPlacement,
            startValue: rightValue,
            initialDirection: "right",
            turnSign: 1,
            metrics,
            branch: "right",
            displaySide: "first"
        }));

        return normalizePlacements(placements, metrics);
    }

    function buildSpinnerLayout(data, metrics) {
        const centerId = getTileId(data.centerDouble);
        const branchIds = new Set([
            ...data.centerTopTiles.map(getTileId),
            ...data.centerBottomTiles.map(getTileId)
        ]);
        const mainTiles = data.chainTiles.filter((tile) => {
            const tileId = getTileId(tile);
            return tileId === centerId || !branchIds.has(tileId);
        });
        const centerIndex = mainTiles.findIndex(tile => getTileId(tile) === centerId);

        if (centerIndex < 0) return buildNormalLayout(data, metrics);

        const centerDisplayMap = buildMainDisplayMap(mainTiles);
        const centerTile = mainTiles[centerIndex];
        const centerDisplay = centerDisplayMap.get(centerId) || tileDisplay(centerTile);
        const centerPlacement = createBasePlacement(centerTile, "vertical", 0, 0, metrics, {
            branch: "spinner",
            direction: "right",
            renderTile: withDisplay(centerTile, centerDisplay),
            isAnchor: true,
            isSpinner: true
        });

        const placements = [centerPlacement];
        const leftTiles = mainTiles.slice(0, centerIndex).reverse();
        const rightTiles = mainTiles.slice(centerIndex + 1);

        placements.push(...buildBranch({
            tiles: leftTiles,
            startPlacement: centerPlacement,
            startValue: centerDisplay.first,
            initialDirection: "left",
            turnSign: -1,
            metrics,
            branch: "left",
            displaySide: "second"
        }));

        placements.push(...buildBranch({
            tiles: rightTiles,
            startPlacement: centerPlacement,
            startValue: centerDisplay.second,
            initialDirection: "right",
            turnSign: 1,
            metrics,
            branch: "right",
            displaySide: "first"
        }));

        placements.push(...buildBranch({
            tiles: data.centerTopTiles,
            startPlacement: centerPlacement,
            startValue: centerTile.left,
            initialDirection: "up",
            turnSign: 1,
            metrics,
            branch: "top",
            displaySide: "second"
        }));

        placements.push(...buildBranch({
            tiles: data.centerBottomTiles,
            startPlacement: centerPlacement,
            startValue: centerTile.right,
            initialDirection: "down",
            turnSign: -1,
            metrics,
            branch: "bottom",
            displaySide: "first"
        }));

        return normalizePlacements(placements, metrics);
    }

    function chooseAnchorIndex(tiles) {
        if (!tiles.length) return 0;
        if (state.anchorId) {
            const current = tiles.findIndex(tile => getTileId(tile) === state.anchorId);
            if (current >= 0) return current;
        }

        const doubleIndex = tiles.findIndex(isDouble);
        const index = doubleIndex >= 0 ? doubleIndex : Math.floor(tiles.length / 2);
        state.anchorId = getTileId(tiles[index]);
        return index;
    }

    function buildBranch(options) {
        const {
            tiles,
            startPlacement,
            startValue,
            initialDirection,
            turnSign,
            metrics,
            branch
        } = options;

        const placements = [];
        let previous = startPlacement;
        let openValue = startValue;
        let direction = initialDirection;
        let segmentTiles = 0;
        let segmentIndex = 0;

        tiles.forEach((tile, index) => {
            const shouldTurn = segmentTiles >= getSegmentLimit(direction, segmentIndex, metrics);
            const turnAfterPlacement = shouldTurn && isDouble(tile);

            if (shouldTurn && !turnAfterPlacement) {
                direction = getTurnDirection(direction, turnSign);
                segmentTiles = 0;
                segmentIndex += 1;
            }

            const connectSide = OPPOSITE_DIRECTION[direction];
            const display = orientTileToConnector(tile, openValue, connectSide);
            const renderTile = withDisplay(tile, display);
            const orientation = getOrientationForDirection(tile, direction);
            const placement = createConnectedPlacement({
                tile,
                renderTile,
                previous,
                direction,
                orientation,
                metrics,
                branch,
                order: index
            });

            placements.push(placement);
            previous = placement;
            openValue = getDisplayValueForSide(display, direction);

            if (turnAfterPlacement) {
                direction = getTurnDirection(direction, turnSign);
                segmentTiles = 0;
                segmentIndex += 1;
            } else {
                segmentTiles += isDouble(tile) ? 0.5 : 1;
            }
        });

        return placements;
    }

    function getSegmentLimit(direction, segmentIndex, metrics) {
        const base = direction === "left" || direction === "right"
            ? metrics.primaryCapacity
            : metrics.verticalCapacity;

        if (segmentIndex === 0) return Math.max(2, base);
        if (segmentIndex === 1) return Math.max(2, base + 1);
        return Math.max(2, base - 1);
    }

    function getTurnDirection(direction, turnSign) {
        const clockwise = {
            right: "down",
            down: "left",
            left: "up",
            up: "right"
        };
        const counter = {
            right: "up",
            up: "left",
            left: "down",
            down: "right"
        };

        return turnSign >= 0 ? clockwise[direction] : counter[direction];
    }

    function createConnectedPlacement(config) {
        const { tile, renderTile, previous, direction, orientation, metrics, branch, order } = config;
        const current = createBasePlacement(tile, orientation, previous.centerX, previous.centerY, metrics, {
            branch,
            direction,
            renderTile,
            order,
            isSpinner: false
        });
        const previousConnector = getConnector(previous, direction);
        const currentConnector = getConnector(current, OPPOSITE_DIRECTION[direction]);
        const extraGap = previous.direction !== direction ? metrics.turnGap : metrics.gap;

        let centerX = previousConnector.x - (currentConnector.x - current.centerX);
        let centerY = previousConnector.y - (currentConnector.y - current.centerY);

        if (direction === "left") centerX -= extraGap;
        if (direction === "right") centerX += extraGap;
        if (direction === "up") centerY -= extraGap;
        if (direction === "down") centerY += extraGap;

        current.centerX = centerX;
        current.centerY = centerY;
        current.x = centerX - current.width / 2;
        current.y = centerY - current.height / 2;
        current.rotation = getRotationForDirection(direction, orientation);
        return current;
    }

    function createBasePlacement(tile, orientation, centerX, centerY, metrics, extra = {}) {
        const placement = {
            tile,
            renderTile: extra.renderTile || tile,
            orientation,
            centerX,
            centerY,
            scale: metrics.scale,
            branch: extra.branch || "main",
            direction: extra.direction || "right",
            order: extra.order || 0,
            isAnchor: !!extra.isAnchor,
            isSpinner: !!extra.isSpinner,
            rotation: getRotationForDirection(extra.direction || "right", orientation)
        };

        applySize(placement, metrics);
        return placement;
    }

    function applySize(placement, metrics) {
        if (placement.orientation === "horizontal") {
            placement.width = metrics.longSide;
            placement.height = metrics.shortSide;
        } else {
            placement.width = metrics.shortSide;
            placement.height = metrics.longSide;
        }

        placement.x = placement.centerX - placement.width / 2;
        placement.y = placement.centerY - placement.height / 2;
    }

    function getConnector(placement, direction) {
        if (direction === "left") return { x: placement.x, y: placement.centerY };
        if (direction === "right") return { x: placement.x + placement.width, y: placement.centerY };
        if (direction === "up") return { x: placement.centerX, y: placement.y };
        return { x: placement.centerX, y: placement.y + placement.height };
    }

    function normalizePlacements(placements, metrics) {
        if (!placements.length) return [];

        const bounds = getPlacementBounds(placements);
        const fitPlan = chooseFitPlan(bounds, metrics);
        const renderScale = metrics.scale * fitPlan.scale;
        const worldWidth = metrics.viewportWidth;
        const worldHeight = metrics.viewportHeight;
        const offsetX = (worldWidth - fitPlan.width) / 2;
        const offsetY = (worldHeight - fitPlan.height) / 2;

        placements.forEach((placement) => {
            const normalized = normalizePlacementForPlan(placement, bounds, fitPlan);

            placement.x = offsetX + normalized.x * fitPlan.scale;
            placement.y = offsetY + normalized.y * fitPlan.scale;
            placement.width = normalized.width * fitPlan.scale;
            placement.height = normalized.height * fitPlan.scale;
            placement.centerX = placement.x + placement.width / 2;
            placement.centerY = placement.y + placement.height / 2;
            placement.orientation = normalized.orientation;
            placement.direction = normalized.direction;
            placement.rotation = getRotationForDirection(placement.direction, placement.orientation);
            placement.scale = renderScale;
            placement.worldWidth = worldWidth;
            placement.worldHeight = worldHeight;
        });

        return placements;
    }

    function getPlacementBounds(placements) {
        return placements.reduce((acc, placement) => {
            acc.left = Math.min(acc.left, placement.x);
            acc.top = Math.min(acc.top, placement.y);
            acc.right = Math.max(acc.right, placement.x + placement.width);
            acc.bottom = Math.max(acc.bottom, placement.y + placement.height);
            return acc;
        }, {
            left: Infinity,
            top: Infinity,
            right: -Infinity,
            bottom: -Infinity
        });
    }

    function getFitPadding(metrics) {
        const shortViewportSide = Math.min(metrics.viewportWidth, metrics.viewportHeight);
        return clamp(Math.round(shortViewportSide * 0.08), 8, Math.max(12, metrics.padding));
    }

    function createFitPlan(bounds, metrics, rotation = 0) {
        const contentWidth = Math.max(1, bounds.right - bounds.left);
        const contentHeight = Math.max(1, bounds.bottom - bounds.top);
        const rotated = normalizeRotation(rotation) === 90 || normalizeRotation(rotation) === 270;
        const naturalWidth = rotated ? contentHeight : contentWidth;
        const naturalHeight = rotated ? contentWidth : contentHeight;
        const padding = getFitPadding(metrics);
        const availableWidth = Math.max(1, metrics.viewportWidth - padding * 2);
        const availableHeight = Math.max(1, metrics.viewportHeight - padding * 2);
        const scale = Math.min(
            1,
            availableWidth / naturalWidth,
            availableHeight / naturalHeight
        );

        return {
            rotation: normalizeRotation(rotation),
            scale,
            width: naturalWidth * scale,
            height: naturalHeight * scale,
            naturalWidth,
            naturalHeight
        };
    }

    function chooseFitPlan(bounds, metrics) {
        const straight = createFitPlan(bounds, metrics, 0);
        const rotated = createFitPlan(bounds, metrics, 90);
        const straightNeedsScale = straight.scale < 0.995;
        const rotatedIsClearlyBetter = rotated.scale > straight.scale + 0.035;

        if (straightNeedsScale && rotatedIsClearlyBetter) {
            return rotated;
        }

        return straight;
    }

    function normalizePlacementForPlan(placement, bounds, fitPlan) {
        if (fitPlan.rotation === 90 || fitPlan.rotation === 270) {
            return rotatePlacementInBounds(placement, bounds, fitPlan.rotation);
        }

        return {
            x: placement.x - bounds.left,
            y: placement.y - bounds.top,
            width: placement.width,
            height: placement.height,
            orientation: placement.orientation,
            direction: placement.direction
        };
    }

    function rotatePlacementInBounds(placement, bounds, rotation) {
        const contentWidth = bounds.right - bounds.left;
        const contentHeight = bounds.bottom - bounds.top;
        const relCenterX = placement.centerX - bounds.left - contentWidth / 2;
        const relCenterY = placement.centerY - bounds.top - contentHeight / 2;
        const clockwise = normalizeRotation(rotation) === 90;
        const rotatedCenterX = clockwise
            ? relCenterY + contentHeight / 2
            : -relCenterY + contentHeight / 2;
        const rotatedCenterY = clockwise
            ? -relCenterX + contentWidth / 2
            : relCenterX + contentWidth / 2;
        const width = placement.height;
        const height = placement.width;

        return {
            x: rotatedCenterX - width / 2,
            y: rotatedCenterY - height / 2,
            width,
            height,
            orientation: swapOrientation(placement.orientation),
            direction: rotateDirection(placement.direction, rotation)
        };
    }

    function swapOrientation(orientation) {
        return orientation === "horizontal" ? "vertical" : "horizontal";
    }

    function rotateDirection(direction, rotation) {
        const clockwise = {
            right: "down",
            down: "left",
            left: "up",
            up: "right"
        };
        const counter = {
            right: "up",
            up: "left",
            left: "down",
            down: "right"
        };
        const normalized = normalizeRotation(rotation);

        if (normalized === 90) return clockwise[direction] || direction;
        if (normalized === 270) return counter[direction] || direction;
        if (normalized === 180) return OPPOSITE_DIRECTION[direction] || direction;
        return direction;
    }

    function paintPlacements(placements, data, metrics) {
        const world = ensureWorld();
        if (!world) return;

        world.querySelector(".cr-empty")?.remove();
        world.style.width = `${placements[0].worldWidth || metrics.viewportWidth}px`;
        world.style.height = `${placements[0].worldHeight || metrics.viewportHeight}px`;
        world.style.setProperty("--cr-base-w", `${metrics.shortSide}px`);
        world.style.setProperty("--cr-base-h", `${metrics.longSide}px`);
        world.style.setProperty("--cr-pip-size", `${Math.max(3, Math.round(5 * metrics.scale))}px`);
        world.style.setProperty("--cr-pip-pad", `${Math.max(4, Math.round(7 * metrics.scale))}px`);
        world.style.setProperty("--cr-divider-size", `${Math.max(1, Math.round(2 * metrics.scale))}px`);
        world.style.setProperty("--cr-radius", `${Math.max(5, Math.round(8 * metrics.scale))}px`);
        world.style.setProperty("--cr-legacy-scale", String(placements[0].scale || metrics.scale));
        state.lastPlacements = placements;
        state.lastMetrics = metrics;
        state.lastData = data;

        const activeIds = new Set();
        const newlyAnimated = [];

        placements.forEach((placement) => {
            const tileId = getTileId(placement.tile);
            activeIds.add(tileId);

            const isNewNode = !state.nodes.has(tileId);
            const node = getOrCreateNode(tileId);
            syncNode(node, placement);

            if ((data.animateNewIds.has(tileId) || isNewNode && state.lastSignature) && !isReducedMotion()) {
                node.classList.add("cr-flight-hidden");
                newlyAnimated.push({ node, placement });
            } else if (isNewNode) {
                playPlacedPulse(node);
            }
        });

        state.nodes.forEach((node, tileId) => {
            if (!activeIds.has(tileId)) {
                node.remove();
                state.nodes.delete(tileId);
            }
        });

        newlyAnimated.forEach(({ node, placement }) => {
            const tileId = getTileId(placement.tile);
            const sourceRect = resolveSourceRect(placement, data);
            animateTilePlacement(placement.renderTile || placement.tile, {
                sourceRect,
                targetNode: node,
                placement,
                placedBy: data.placedBy
            }).finally(() => {
                node.classList.remove("cr-flight-hidden");
                playPlacedPulse(node);
            });

            if (sourceRect && state.config.onPlacementSourceConsumed) {
                state.config.onPlacementSourceConsumed(tileId);
            }
        });

        const focusPlacement = findFocusPlacement(placements, data.animateNewIds) || placements[placements.length - 1];
        scrollToPlacement(focusPlacement);
    }

    function getOrCreateNode(tileId) {
        const existing = state.nodes.get(tileId);
        if (existing) return existing;

        const node = document.createElement("div");
        node.className = "cr-tile-shell";
        node.dataset.tileId = tileId;
        state.world.appendChild(node);
        state.nodes.set(tileId, node);
        return node;
    }

    function ensureGuideLayer() {
        if (state.guideLayer && state.guideLayer.parentNode === state.world) {
            return state.guideLayer;
        }

        state.guideLayer = document.createElement("div");
        state.guideLayer.className = "cr-guide-layer";
        state.world.appendChild(state.guideLayer);
        return state.guideLayer;
    }

    function syncNode(node, placement) {
        const tile = placement.renderTile || placement.tile;
        const isTileDouble = isDouble(placement.tile);
        const rotationClass = `cr-rot-${normalizeRotation(placement.rotation)}`;

        node.className = [
            "cr-tile-shell",
            `cr-orient-${placement.orientation}`,
            rotationClass,
            isTileDouble ? "cr-double" : "",
            placement.isSpinner ? "cr-spinner" : "",
            placement.isAnchor ? "cr-anchor" : "",
            `cr-branch-${placement.branch}`
        ].filter(Boolean).join(" ");

        node.dataset.tileId = getTileId(placement.tile);
        node.style.width = `${placement.width}px`;
        node.style.height = `${placement.height}px`;
        node.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0)`;
        node.style.zIndex = placement.isAnchor ? "4" : String(2 + placement.order);
        node.replaceChildren(createDominoElement(tile, placement));
    }

    function createDominoElement(tile, placement) {
        const left = Number(tile.renderLeft ?? tile.left ?? 0);
        const right = Number(tile.renderRight ?? tile.right ?? 0);
        const domino = document.createElement("div");
        domino.className = `tile ${placement.orientation === "horizontal" ? "horizontal" : ""}`.trim();
        domino.dataset.tileId = getTileId(tile);
        domino.setAttribute("draggable", "false");
        domino.setAttribute("aria-label", `${left}:${right}`);
        domino.innerHTML = `
            <div class="tile-half">${renderLegacyDots(left)}</div>
            <div class="tile-half">${renderLegacyDots(right)}</div>
        `;

        if (placement.isSpinner) {
            const spinner = document.createElement("span");
            spinner.className = "cr-spinner-mark";
            domino.appendChild(spinner);
        }

        return domino;
    }

    function renderLegacyDots(value) {
        const safeValue = clamp(Number(value) || 0, 0, 6);
        if (safeValue === 0) return '<div class="dots dots-0"></div>';
        return `<div class="dots dots-${safeValue}">${'<div class="dot"></div>'.repeat(safeValue)}</div>`;
    }

    function playFlight(tile, position = {}) {
        const targetNode = position.targetNode;
        if (!targetNode || isReducedMotion()) {
            if (targetNode) targetNode.classList.remove("cr-flight-hidden");
            return Promise.resolve();
        }

        const targetRect = targetNode.getBoundingClientRect();
        const sourceRect = position.sourceRect || findSourceRect(tile) || targetRect;
        const flight = document.createElement("div");
        const placement = position.placement || {
            orientation: "vertical",
            isSpinner: false,
            rotation: 0
        };

        flight.className = [
            "cr-flight",
            `cr-orient-${placement.orientation || "vertical"}`,
            `cr-rot-${normalizeRotation(placement.rotation || 0)}`
        ].join(" ");

        flight.style.left = `${targetRect.left}px`;
        flight.style.top = `${targetRect.top}px`;
        flight.style.width = `${targetRect.width}px`;
        flight.style.height = `${targetRect.height}px`;
        flight.style.setProperty("--cr-legacy-scale", `${Math.max(0.45, Math.min(targetRect.width / 35, targetRect.height / 35))}`);
        flight.appendChild(createDominoElement(tile, placement));
        document.body.appendChild(flight);

        const sourceCenterX = sourceRect.left + sourceRect.width / 2;
        const sourceCenterY = sourceRect.top + sourceRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const dx = sourceCenterX - targetCenterX;
        const dy = sourceCenterY - targetCenterY;
        const scaleX = sourceRect.width / Math.max(targetRect.width, 1);
        const scaleY = sourceRect.height / Math.max(targetRect.height, 1);

        const animation = flight.animate([
            {
                transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
                opacity: 1
            },
            {
                transform: "translate3d(0, 0, 0) scale(1, 1)",
                opacity: 1
            }
        ], {
            duration: state.config.moveMs,
            delay: state.config.moveDelayMs,
            easing: state.config.easing,
            fill: "forwards"
        });

        return animation.finished
            .catch(() => null)
            .finally(() => {
                flight.remove();
                targetNode.classList.remove("cr-flight-hidden");
            });
    }

    function playPlacedPulse(node) {
        node.classList.remove("cr-place-in");
        void node.offsetWidth;
        node.classList.add("cr-place-in");
        node.addEventListener("animationend", () => {
            node.classList.remove("cr-place-in");
        }, { once: true });
    }

    function playInvalidFeedback() {
        if (state.container) {
            state.container.classList.remove("cr-invalid-board");
            void state.container.offsetWidth;
            state.container.classList.add("cr-invalid-board");
            state.container.addEventListener("animationend", () => {
                state.container.classList.remove("cr-invalid-board");
            }, { once: true });
        }
    }

    function resolveSourceRect(placement, data) {
        if (typeof state.config.getSourceRect === "function") {
            const rect = state.config.getSourceRect(placement.tile, placement, {
                placedBy: data.placedBy,
                tileId: getTileId(placement.tile)
            });
            if (rect) return rect;
        }

        return findSourceRect(placement.tile);
    }

    function findSourceRect(tile) {
        const element = findSourceElement(tile);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    function findSourceElement(tile) {
        const tileId = tile ? getTileId(tile) : "";
        if (!tileId) return null;
        return document.querySelector(`#myHand [data-tile-id="${cssEscape(tileId)}"]`);
    }

    function findFocusPlacement(placements, animateIds) {
        for (const placement of placements) {
            if (animateIds.has(getTileId(placement.tile))) return placement;
        }

        return null;
    }

    function scrollToPlacement(placement) {
        if (!placement || !state.container) return;
        state.container.scrollLeft = 0;
        state.container.scrollTop = 0;
    }

    function createGuideDescriptor(side, tile, metrics) {
        const simulated = getSimulatedPlacement(side, tile, metrics);
        if (simulated) {
            return {
                side,
                x: simulated.x,
                y: simulated.y,
                width: simulated.width,
                height: simulated.height,
                centerX: simulated.centerX,
                centerY: simulated.centerY,
                orientation: simulated.orientation,
                rotation: simulated.rotation,
                renderTile: simulated.renderTile || simulated.tile,
                scale: simulated.scale
            };
        }

        const previous = getPlacementForSide(side);

        if (!previous) {
            const orientation = getOrientationForDirection(normalizeTile(tile), "right");
            const width = orientation === "horizontal" ? metrics.longSide : metrics.shortSide;
            const height = orientation === "horizontal" ? metrics.shortSide : metrics.longSide;
            const x = Math.max((metrics.viewportWidth - width) / 2, metrics.padding);
            const y = Math.max((metrics.viewportHeight - height) / 2, metrics.padding);

            return {
                side,
                x,
                y,
                width,
                height,
                centerX: x + width / 2,
                centerY: y + height / 2,
                orientation,
                rotation: getRotationForDirection("right", orientation),
                renderTile: normalizeTile(tile),
                scale: metrics.scale
            };
        }

        const guide = {
            side,
            x: previous.x,
            y: previous.y,
            width: previous.width,
            height: previous.height,
            centerX: previous.centerX,
            centerY: previous.centerY,
            orientation: previous.orientation,
            rotation: previous.rotation,
            renderTile: normalizeTile(tile),
            scale: previous.scale
        };

        return guide;
    }

    function getSimulatedPlacement(side, tile, metrics) {
        const data = state.lastData;
        const candidate = normalizeTile(tile);
        if (!candidate) return null;

        const simulatedData = cloneChainData(data, candidate, side);
        const kind = getLayoutKind(simulatedData);
        const placements = kind === "all-fives" && simulatedData.centerDouble
            ? buildSpinnerLayout(simulatedData, metrics)
            : buildNormalLayout(simulatedData, metrics);

        const target = placements.find(placement => getTileId(placement.tile) === getTileId(candidate));
        if (!target) return null;

        const currentAnchor = state.lastPlacements.find(placement => placement.isAnchor);
        const simulatedAnchor = currentAnchor
            ? placements.find(placement => getTileId(placement.tile) === getTileId(currentAnchor.tile))
            : null;

        if (!currentAnchor || !simulatedAnchor) return target;

        const dx = currentAnchor.x - simulatedAnchor.x;
        const dy = currentAnchor.y - simulatedAnchor.y;

        return {
            ...target,
            x: target.x + dx,
            y: target.y + dy,
            centerX: target.centerX + dx,
            centerY: target.centerY + dy
        };
    }

    function cloneChainData(data, candidate, side) {
        const base = data || {
            chainTiles: [],
            centerDouble: null,
            centerTopTiles: [],
            centerBottomTiles: [],
            gameType: state.config.mode === "mode1" ? "AllFives" : ""
        };

        const clone = {
            ...base,
            chainTiles: [...(base.chainTiles || [])],
            centerTopTiles: [...(base.centerTopTiles || [])],
            centerBottomTiles: [...(base.centerBottomTiles || [])],
            animateNewIds: new Set()
        };

        if (!clone.chainTiles.length) {
            clone.chainTiles = [candidate];
            return clone;
        }

        if (side === "left") {
            clone.chainTiles = [candidate, ...clone.chainTiles];
        } else if (side === "right") {
            clone.chainTiles = [...clone.chainTiles, candidate];
        } else if (side === "center-top") {
            clone.centerTopTiles = [...clone.centerTopTiles, candidate];
        } else if (side === "center-bottom") {
            clone.centerBottomTiles = [...clone.centerBottomTiles, candidate];
        }

        return clone;
    }

    function getPlacementForSide(side) {
        if (!state.lastPlacements.length) return null;

        const byBranch = branchName => state.lastPlacements
            .filter(placement => placement.branch === branchName);

        if (side === "left") return getLast(byBranch("left")) || state.lastPlacements.find(placement => placement.isAnchor);
        if (side === "right") return getLast(byBranch("right")) || state.lastPlacements.find(placement => placement.isAnchor);
        if (side === "center-top") return getLast(byBranch("top")) || state.lastPlacements.find(placement => placement.isSpinner || placement.isAnchor);
        if (side === "center-bottom") return getLast(byBranch("bottom")) || state.lastPlacements.find(placement => placement.isSpinner || placement.isAnchor);

        return state.lastPlacements.find(placement => placement.isAnchor) || state.lastPlacements[0];
    }

    function getLast(items) {
        return items.length ? items[items.length - 1] : null;
    }

    function selectGuide(nextGuide) {
        state.guides.forEach((guide) => {
            guide.selected = guide === nextGuide;
            guide.el?.classList.toggle("cr-guide-active", guide.selected);
        });
    }

    function expandWorldForGuides(guides, metrics) {
        if (!state.world || !guides.length) return;

        const currentWidth = parseFloat(state.world.style.width) || metrics.viewportWidth;
        const currentHeight = parseFloat(state.world.style.height) || metrics.viewportHeight;
        const right = Math.max(...guides.map(guide => guide.x + guide.width + metrics.padding));
        const bottom = Math.max(...guides.map(guide => guide.y + guide.height + metrics.padding));

        state.world.style.width = `${Math.max(currentWidth, Math.ceil(right))}px`;
        state.world.style.height = `${Math.max(currentHeight, Math.ceil(bottom))}px`;
    }

    function restoreWorldSize() {
        if (!state.world || !state.lastPlacements.length) return;
        const first = state.lastPlacements[0];
        state.world.style.width = `${first.worldWidth || state.lastMetrics?.viewportWidth || state.container?.clientWidth || 0}px`;
        state.world.style.height = `${first.worldHeight || state.lastMetrics?.viewportHeight || state.container?.clientHeight || 0}px`;
    }

    function autoPanDuringDrag(clientX, clientY) {
        return;
    }

    function attachPanBehavior(container) {
        if (state.initializedContainers.has(container)) return;
        state.initializedContainers.add(container);
    }

    function buildMainDisplayMap(tiles) {
        const displayMap = new Map();
        if (!tiles.length) return displayMap;

        if (tiles.length === 1) {
            displayMap.set(getTileId(tiles[0]), tileDisplay(tiles[0]));
            return displayMap;
        }

        const firstShared = getSharedValue(tiles[0], tiles[1]);
        const firstDisplay = orientTile(tiles[0], firstShared, "second");
        displayMap.set(getTileId(tiles[0]), firstDisplay);

        let openValue = firstDisplay.second;
        for (let index = 1; index < tiles.length; index += 1) {
            const tile = tiles[index];
            const display = orientTile(tile, openValue, "first");
            displayMap.set(getTileId(tile), display);
            openValue = display.second;
        }

        return displayMap;
    }

    function orientTile(tile, value, side = "first") {
        if (value === null || value === undefined) return tileDisplay(tile);

        if (side === "second") {
            if (tile.right === value) return { first: tile.left, second: tile.right };
            if (tile.left === value) return { first: tile.right, second: tile.left };
        } else {
            if (tile.left === value) return { first: tile.left, second: tile.right };
            if (tile.right === value) return { first: tile.right, second: tile.left };
        }

        return tileDisplay(tile);
    }

    function orientTileToConnector(tile, value, connectorSide) {
        const targetHalf = connectorSide === "left" || connectorSide === "up"
            ? "first"
            : "second";

        return orientTile(tile, value, targetHalf);
    }

    function getDisplayValueForSide(display, side) {
        return side === "left" || side === "up"
            ? display.first
            : display.second;
    }

    function getSharedValue(firstTile, secondTile) {
        return [firstTile.left, firstTile.right]
            .find(value => value === secondTile.left || value === secondTile.right) ?? null;
    }

    function tileDisplay(tile) {
        return {
            first: Number(tile.renderLeft ?? tile.left ?? 0),
            second: Number(tile.renderRight ?? tile.right ?? 0)
        };
    }

    function withDisplay(tile, display) {
        return {
            ...tile,
            renderLeft: display.first,
            renderRight: display.second
        };
    }

    function getOrientationForDirection(tile, direction) {
        const horizontalFlow = direction === "left" || direction === "right";
        if (isDouble(tile)) return horizontalFlow ? "vertical" : "horizontal";
        return horizontalFlow ? "horizontal" : "vertical";
    }

    function getRotationForDirection(direction, orientation) {
        return orientation === "horizontal" ? 270 : 0;
    }

    function normalizeRotation(value) {
        const normalized = ((Number(value) || 0) % 360 + 360) % 360;
        return [0, 90, 180, 270].includes(normalized) ? normalized : 0;
    }

    function isDouble(tile) {
        return tile && Number(tile.left) === Number(tile.right);
    }

    function getTileId(tile) {
        return String(tile?.id ?? "");
    }

    function isReducedMotion() {
        if (typeof state.config.shouldReduceMotion === "function") {
            return !!state.config.shouldReduceMotion();
        }

        return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === "function") {
            return window.CSS.escape(value);
        }

        return String(value).replace(/["\\]/g, "\\$&");
    }

    const api = {
        initChainRenderer,
        renderChain,
        animateTilePlacement,
        showPlacementGuide,
        updatePlacementGuide,
        getSelectedPlacementSide,
        hidePlacementGuide,
        clearChain
    };

    window.ChainRenderer = api;
})();
