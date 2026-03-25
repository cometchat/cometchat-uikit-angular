import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, Subscription } from 'rxjs';
import { CometChatLocalize, ThemeService } from '@cometchat/chat-uikit-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private titleService = inject(Title);
  private activatedRoute = inject(ActivatedRoute);
  private routerSub?: Subscription;
  protected themeService = inject(ThemeService);

  ngOnInit(): void {
    // setInterval(() => {
    //   this.themeService.toggleTheme();
    // }, 100);
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updatePageTitle(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const titleKey = route.snapshot.data['title'];
    if (titleKey) {
      const localizedTitle = CometChatLocalize.getLocalizedString(titleKey);
      this.titleService.setTitle(localizedTitle);
    }
  }
}
