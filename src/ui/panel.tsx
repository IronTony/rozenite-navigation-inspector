import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';

import type { NavigationInspectorEventMap } from '../shared/event-map';
import type { NavigationEvent, NavigationTree, RouteInfo, SitemapEntry } from '../shared/types';
import { NavigationConsole } from './components/NavigationConsole';
import { ResizeHandle } from './components/ResizeHandle';
import { RouteDetails } from './components/RouteDetails';
import { SitemapView } from './components/SitemapView';
import { Timeline } from './components/Timeline';
import { Toolbar } from './components/Toolbar';
import { TreeView } from './components/TreeView';
import './globals.css';

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 600;
const DETAILS_MIN = 150;
const DETAILS_MAX = 500;
const TIMELINE_MIN = 15;
const TIMELINE_MAX = 70;

function normalizeRoute(route: string): string {
  let normalized = route.replace(/^[a-zA-Z][\w+.-]*:\/\/\/?/, '/');
  normalized = normalized.replace(/\([^)]*\)\/?/g, '');
  normalized = normalized.replace(/\/{2,}/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || '/';
}

function collectRoutesFromTree(node: NavigationTree, routes: Set<string> = new Set()): Set<string> {
  if (node.path) {
    routes.add(node.path);
  } else if (node.routeName) {
    routes.add(node.routeName);
  }
  for (const child of node.children) {
    collectRoutesFromTree(child, routes);
  }
  return routes;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function NavigationInspectorPanel() {
  const [tree, setTree] = useState<NavigationTree | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [selectedNode, setSelectedNode] = useState<NavigationTree | null>(null);
  const [events, setEvents] = useState<NavigationEvent[]>([]);
  const [sitemap, setSitemap] = useState<SitemapEntry[]>([]);
  const [deviceRoutes, setDeviceRoutes] = useState<string[]>([]);
  const accumulatedTreeRoutes = useRef<Set<string>>(new Set());

  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [detailsWidth, setDetailsWidth] = useState(288);
  const [timelineHeight, setTimelineHeight] = useState(45);
  const contentRef = useRef<HTMLDivElement>(null);

  const client = useRozeniteDevToolsClient<NavigationInspectorEventMap>({
    pluginId: 'rozenite-navigation-inspector',
  });

  useEffect(() => {
    if (!tree) return;
    collectRoutesFromTree(tree, accumulatedTreeRoutes.current);
  }, [tree]);

  const allRoutes = useMemo(() => {
    const merged = new Set<string>();
    for (const route of deviceRoutes) {
      merged.add(normalizeRoute(route));
    }
    for (const route of accumulatedTreeRoutes.current) {
      merged.add(normalizeRoute(route));
    }
    function collectSitemapPaths(entries: SitemapEntry[]) {
      for (const entry of entries) {
        merged.add(entry.path);
        collectSitemapPaths(entry.children);
      }
    }
    collectSitemapPaths(sitemap);
    return Array.from(merged).sort();
  }, [deviceRoutes, tree, sitemap]);

  useEffect(() => {
    if (!client) return;

    client.send('nav:request-snapshot', undefined);
    client.send('nav:request-routes', undefined);
    client.send('nav:request-sitemap', undefined);

    const subs = [
      client.onMessage('nav:tree-snapshot', ({ tree: t, activeRoute: ar }) => {
        setTree(t);
        setActiveRoute(ar);
      }),
      client.onMessage('nav:tree-update', ({ tree: t, activeRoute: ar }) => {
        setTree(t);
        setActiveRoute(ar);
      }),
      client.onMessage('nav:event', (event) => {
        setEvents((prev) => [...prev.slice(-199), event]);
      }),
      client.onMessage('nav:sitemap', ({ entries }) => {
        setSitemap(entries);
      }),
      client.onMessage('nav:routes-list', ({ routes }) => {
        setDeviceRoutes(routes);
      }),
    ];

    return () => subs.forEach((s) => s.remove());
  }, [client]);

  const handleNavigate = useCallback(
    (path: string, params?: Record<string, unknown>, action?: string) => {
      client?.send('nav:navigate', {
        path,
        params,
        action: (action as 'push' | 'navigate' | 'replace') || 'navigate',
      });
    },
    [client]
  );

  const handleRequestSitemap = useCallback(() => {
    client?.send('nav:request-sitemap', undefined);
  }, [client]);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => clamp(prev + delta, SIDEBAR_MIN, SIDEBAR_MAX));
  }, []);

  const handleDetailsResize = useCallback((delta: number) => {
    setDetailsWidth((prev) => clamp(prev - delta, DETAILS_MIN, DETAILS_MAX));
  }, []);

  const handleTimelineResize = useCallback((delta: number) => {
    const el = contentRef.current;
    if (!el) return;
    const totalHeight = el.clientHeight;
    const deltaPercent = (delta / totalHeight) * 100;
    setTimelineHeight((prev) => clamp(prev - deltaPercent, TIMELINE_MIN, TIMELINE_MAX));
  }, []);

  if (!client) {
    return (
      <div className="panel__connecting">
        <p>Connecting to device...</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <Toolbar activeRoute={activeRoute} />

      <div className="panel__main">
        <div className="panel__sidebar" style={{ width: sidebarWidth }}>
          <SitemapView entries={sitemap} onRefresh={handleRequestSitemap} onNavigate={(path) => handleNavigate(path)} />
        </div>

        <ResizeHandle direction="vertical" onResize={handleSidebarResize} />

        <div className="panel__content" ref={contentRef}>
          <div className="panel__tree-area">
            <div className="panel__tree">
              <TreeView tree={tree} selectedNode={selectedNode} onSelectNode={setSelectedNode} />
            </div>

            <ResizeHandle direction="vertical" onResize={handleDetailsResize} />

            <div className="panel__details" style={{ width: detailsWidth }}>
              <RouteDetails node={selectedNode} activeRoute={activeRoute} />
            </div>
          </div>

          <ResizeHandle direction="horizontal" onResize={handleTimelineResize} />

          <div className="panel__timeline" style={{ height: `${timelineHeight}%` }}>
            <Timeline events={events} onClear={() => setEvents([])} />
          </div>
        </div>
      </div>

      <NavigationConsole routes={allRoutes} onNavigate={handleNavigate} />
    </div>
  );
}
