import { DOCUMENT } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AppConfig, ConfigService } from '@core/services/config';
import { MediaWatcherService } from '@core/services/media-watcher';
import { Subject, combineLatest, filter, map, takeUntil } from 'rxjs';
import { EmptyLayoutComponent } from './layouts/empty/empty.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [EmptyLayoutComponent]
})
export class LayoutComponent implements OnInit, OnDestroy {
  #unsubscribeAll = new Subject();
  #activatedRoute = inject(ActivatedRoute);
  #document = inject(DOCUMENT);
  #router = inject(Router);
  #configService = inject(ConfigService);
  #mediaWatcherService = inject(MediaWatcherService);
  config: AppConfig;
  layout: string;
  scheme: 'dark' | 'light';
  theme: string;

  ngOnInit(): void {
    // Set the theme and scheme based on the configuration
    combineLatest([
      this.#configService.config$,
      this.#mediaWatcherService.onMediaQueryChange$(['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'])
    ])
      .pipe(
        takeUntil(this.#unsubscribeAll),
        map(([config, mql]) => {
          const options = {
            scheme: config['scheme'],
            theme: config['theme']
          };

          if (config['scheme'] === 'auto') {
            options.scheme = mql.breakpoints['(prefers-color-scheme: dark)'] ? 'dark' : 'light';
          }

          return options;
        })
      )
      .subscribe((options) => {
        // Store the options
        this.scheme = options.scheme;
        this.theme = options.theme;

        // Update the scheme and theme
        this._updateScheme();
        this._updateTheme();
      });

    // Subscribe to config changes
    this.#configService.config$.pipe(takeUntil(this.#unsubscribeAll)).subscribe((config: AppConfig) => {
      // Store the config
      this.config = config;

      // Update the layout
      this._updateLayout();
    });

    // Subscribe to NavigationEnd event
    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.#unsubscribeAll)
      )
      .subscribe(() => {
        // Update the layout
        this._updateLayout();
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.#unsubscribeAll.next(null);
    this.#unsubscribeAll.complete();
  }

  private _updateLayout(): void {
    // Get the current activated route
    let route = this.#activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    // 1. Set the layout from the config
    this.layout = this.config.layout;

    // 2. Get the query parameter from the current route and
    // set the layout and save the layout to the config
    const layoutFromQueryParam = route.snapshot.queryParamMap.get('layout');
    if (layoutFromQueryParam) {
      this.layout = layoutFromQueryParam;
      if (this.config) {
        this.config.layout = layoutFromQueryParam;
      }
    }

    // 3. Iterate through the paths and change the layout as we find
    // a config for it.
    //
    // The reason we do this is that there might be empty grouping
    // paths or componentless routes along the path. Because of that,
    // we cannot just assume that the layout configuration will be
    // in the last path's config or in the first path's config.
    //
    // So, we get all the paths that matched starting from root all
    // the way to the current activated route, walk through them one
    // by one and change the layout as we find the layout config. This
    // way, layout configuration can live anywhere within the path and
    // we won't miss it.
    //
    // Also, this will allow overriding the layout in any time so we
    // can have different layouts for different routes.
    const paths = route.pathFromRoot;
    paths.forEach((path) => {
      // Check if there is a 'layout' data
      if (path.routeConfig && path.routeConfig.data && path.routeConfig.data.layout) {
        // Set the layout
        this.layout = path.routeConfig.data.layout;
      }
    });
  }

  /**
   * Update the selected scheme
   *
   * @private
   */
  private _updateScheme(): void {
    // Remove class names for all schemes
    this.#document.body.classList.remove('light', 'dark');

    // Add class name for the currently selected scheme
    this.#document.body.classList.add(this.scheme);
  }

  /**
   * Update the selected theme
   *
   * @private
   */
  private _updateTheme(): void {
    // Find the class name for the previously selected theme and remove it

    // Add class name for the currently selected theme
    this.#document.body.classList.add(this.theme);
  }
}
