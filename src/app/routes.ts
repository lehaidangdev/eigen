import { parse } from "url"
import { AppModule } from "app/AppRegistry"
import { ArtsyWebViewConfig } from "app/Components/ArtsyWebView"
import { unsafe__getEnvironment } from "app/store/GlobalStore"
import { RouteMatcher } from "app/system/navigation/RouteMatcher"
import { compact } from "lodash"
import { parse as parseQueryString } from "query-string"
import { Platform } from "react-native"
import { GraphQLTaggedNode } from "relay-runtime"

export function matchRoute(
  url: string
):
  | { type: "match"; module: AppModule; query?: GraphQLTaggedNode; params: object }
  | { type: "external_url"; url: string } {
  if (isProtocolEncoded(url)) {
    // if entire url is encoded, decode!
    // else user will land on VanityUrlEntity for url that otherwise would have been valid
    url = decodeUrl(url)
  }
  let parsed = parse(url)
  if (parsed.host && isEncoded(url)) {
    // likely from a deeplinked universal link as we do not pass urls with host in app
    // special characters in paths passed as props in app must be intentional
    parsed = parse(decodeUrl(url))
  }
  const pathParts = parsed.pathname?.split(/\/+/).filter(Boolean) ?? []
  const queryParams: object = parsed.query
    ? parseQueryString(parsed.query, { arrayFormat: "index" })
    : {}

  const domain = (parsed.host || parse(unsafe__getEnvironment().webURL).host) ?? "artsy.net"
  const routes = getDomainMap()[domain as any]

  if (!routes) {
    // Unrecognized domain, let's send the user to Safari or whatever
    return {
      type: "external_url",
      url,
    }
  }

  for (const route of routes) {
    const result = route.match(pathParts)
    if (result) {
      return {
        type: "match",
        module: route.module,
        params: { ...queryParams, ...result },
      }
    }
  }

  // This shouldn't ever happen.
  console.error("Unhandled route", url)
  return {
    type: "match",
    module: "ReactWebView",
    params: { url },
  }
}

export const addRoute = (route: string, module: AppModule, paramsMapper?: (val: any) => object) => {
  return new RouteMatcher(route, module, paramsMapper)
}

export function addWebViewRoute(url: string, config?: ArtsyWebViewConfig) {
  return addRoute(url, "ReactWebView", (params) => ({
    url: replaceParams(url, params),
    ...config,
  }))
}

export function replaceParams(url: string, params: any) {
  url = url.replace(/\*$/, params["*"])
  let match = url.match(/:(\w+)/)
  while (match) {
    const key = match[1]
    if (!(key in params)) {
      console.error("[replaceParams]: something is very wrong", key, params)
      return url
    }
    url = url.replace(":" + key, params[key])
    match = url.match(/:(\w+)/)
  }
  return url
}

function isProtocolEncoded(url: string): boolean {
  const regex = new RegExp("^(http%|https%|%)")
  return regex.test(url)
}

function isEncoded(url: string): boolean {
  return url !== decodeURIComponent(url)
}

function decodeUrl(url: string): string {
  let maxDepth = 10
  // allows to exit the loop in cases of weird custom encoding
  // or for some reason url is encoded more than 10 times
  while (isEncoded(url) && maxDepth > 0) {
    url = decodeURIComponent(url)
    maxDepth--
  }
  return url
}

function getDomainMap(): Record<string, RouteMatcher[] | null> {
  const liveDotArtsyDotNet: RouteMatcher[] = compact([
    Platform.OS === "ios"
      ? addRoute("/*", "LiveAuction", (params) => ({ slug: params["*"] }))
      : addRoute("/*", "ReactWebView", (params) => ({
          url: unsafe__getEnvironment().predictionURL + "/" + params["*"],
        })),
  ])

  const artsyDotNet: RouteMatcher[] = compact([
    addRoute("/", "Home"),
    addRoute("/about", "About"),
    addRoute("/activity", "Activity"),
    addRoute("/art-quiz", "ArtQuiz"),
    addRoute("/art-quiz/artworks", "ArtQuiz"),
    addRoute("/art-quiz/results", "ArtQuizResults"),
    addRoute("/article2/:articleID", "Article"), // TODO: AREnableNativeArticleView: Rename /article2 to /article once we've removed the old /article route
    addRoute("/articles", "Articles"),
    addRoute("/artist-series/:artistSeriesID", "ArtistSeries"),
    addRoute("/artist/:artistID", "Artist"),
    addRoute("/artist/:artistID/articles", "ArtistArticles"),
    addRoute("/artist/:artistID/artist-series", "FullArtistSeriesList"),
    addRoute("/artist/:artistID/auction-result/:auctionResultInternalID", "AuctionResult"),
    addRoute("/artist/:artistID/auction-results", "Artist", (params) => ({
      ...params,
      initialTab: "Insights",
    })),
    addRoute("/artist/:artistID/shows", "ArtistShows"),

    // Routes `/artist/:artistID/*` and `"/:profile_id_ignored/artist/:artistID"`
    // MUST go together The following two
    addRoute("/artist/:artistID/*", "Artist"),
    addRoute("/:profile_id_ignored/artist/:artistID", "Artist"), // For artists in a gallery context, like https://www.artsy.net/spruth-magers/artist/astrid-klein . Until we have a native // version of the gallery profile/context, we will use the normal native artist view instead of showing a web view.

    addRoute("/artwork-certificate-of-authenticity", "ArtworkCertificateAuthenticity"),
    addRoute("/artwork-classifications", "ArtworkAttributionClassFAQ"),
    addRoute("/artwork-lists", "MyProfile", (params) => ({
      ...params,
      initialTab: "Saves",
    })),
    addRoute("/artwork-list/:listID", "ArtworkList"),
    addRoute("/artwork-recommendations", "ArtworkRecommendations"),
    addRoute("/artwork/:artworkID", "Artwork"),
    addRoute("/artwork/:artworkID/medium", "ArtworkMedium"),
    addRoute("/auction-registration/:saleID", "AuctionRegistration"),
    addRoute("/auction-results-for-artists-you-collect", "AuctionResultsForArtistsYouCollect"),
    addRoute("/auction-results-for-artists-you-follow", "AuctionResultsForArtistsYouFollow"),
    addRoute("/auction/:saleID", "Auction"),
    addRoute("/auction/:saleID/bid/:artworkID", "AuctionBidArtwork"),
    addRoute("/auction/:saleID/buyers-premium", "AuctionBuyersPremium"),
    addRoute("/auction/:saleID/info", "AuctionInfo"),
    addRoute("/auctions", "Auctions"),
    addRoute("/auctions/lots-for-you-ending-soon", "LotsByArtistsYouFollow"),
    addRoute("/city-fair/:citySlug", "CityFairList"),
    addRoute("/city-save/:citySlug", "CitySavedList"),
    addRoute("/city/:citySlug/:section", "CitySectionList"),
    addRoute("/collection/:collectionID", "Collection"),
    addRoute("/collection/:collectionID/artists", "FullFeaturedArtistList"),
    addRoute("/collections/my-collection/artworks/new/submissions/new", "SubmitArtwork"), // TODO: Follow-up about below route names
    addRoute("/collections/my-collection/marketing-landing", "SalesNotRootTabView"),
    addRoute("/consign/submission", "SubmitArtwork"),
    addRoute("/conversation/:conversationID", "Conversation"),
    addRoute("/conversation/:conversationID/details", "ConversationDetails"),
    addRoute("/dev-menu-old", "DevMenuOld"),
    addRoute("/dev-menu", "DevMenu"),
    addRoute("/fair/:fairID", "Fair"),
    addRoute("/fair/:fairID/articles", "FairArticles"),
    addRoute("/fair/:fairID/artists", "Fair"),
    addRoute("/fair/:fairID/artworks", "Fair"),
    addRoute("/fair/:fairID/exhibitors", "Fair"),
    addRoute("/fair/:fairID/followedArtists", "FairAllFollowedArtists"),
    addRoute("/fair/:fairID/info", "FairMoreInfo"),
    addRoute("/favorites", "Favorites"),
    addRoute("/feature/:slug", "Feature"),
    addRoute("/gene/:geneID", "Gene"),
    addRoute("/inbox", "Inbox"),
    addRoute("/inquiry/:artworkID", "Inquiry"),
    addRoute("/local-discovery", "LocalDiscovery"),
    addRoute("/make-offer/:artworkID", "MakeOfferModal"),
    addRoute("/map", "NewMap"),
    addRoute("/my-account", "MyAccount"),
    addRoute("/my-account", "MyAccount"),
    addRoute("/my-account/delete-account", "MyAccountDeleteAccount"),
    addRoute("/my-account/edit-email", "MyAccountEditEmail"),
    addRoute("/my-account/edit-password", "MyAccountEditPassword"),
    addRoute("/my-account/edit-phone", "MyAccountEditPhone"),
    addRoute("/my-account/edit-price-range", "MyAccountEditPriceRange"),
    addRoute("/my-collection", "MyCollection"),
    addRoute("/my-collection/artwork/:artworkId", "MyCollectionArtwork"),
    addRoute("/my-collection/artwork/:artworkID/price-estimate", "RequestForPriceEstimateScreen"),
    addRoute(
      "/my-collection/artwork/:artworkID/price-estimate/success",
      "RequestForPriceEstimateConfirmationScreen"
    ),
    addRoute("/my-collection/artworks/:artworkID/edit", "AddOrEditMyCollectionArtwork"),
    addRoute("/my-collection/artworks/new", "AddOrEditMyCollectionArtwork"),
    addRoute("/my-collection/career-highlights", "CareerHighlightsBigCardsSwiper"),
    addRoute("/my-collection/median-sale-price-at-auction/:artistID", "MedianSalePriceAtAuction"),
    addRoute("/my-profile", "MyProfile"),
    addRoute("/my-profile/edit", "MyProfileEditForm"),
    addRoute("/my-profile/payment", "MyProfilePayment"),
    addRoute("/my-profile/payment/new-card", "MyProfilePaymentNewCreditCard"),
    addRoute("/my-profile/push-notifications", "MyProfilePushNotifications"),
    addRoute("/my-profile/saved-search-alerts", "SavedSearchAlertsList"),
    addRoute("/my-profile/saved-search-alerts/:savedSearchAlertId", "EditSavedSearchAlert"),
    addRoute("/my-profile/settings", "MyProfileSettings"),
    addRoute("/new-for-you", "NewWorksForYou"),
    addRoute("/new-works-from-galleries-you-follow", "NewWorksFromGalleriesYouFollow"),
    addRoute("/orders", "OrderHistory"),
    addRoute("/partner-locations/:partnerID", "PartnerLocations"),
    addRoute("/partner/:partnerID", "Partner"),
    addRoute("/partner/:partnerID/artists/:artistID", "Partner"),
    addRoute("/partner/:partnerID/shows", "Partner", (params) => ({
      ...params,
      initialTab: "Shows",
    })),
    addRoute("/partner/:partnerID/works", "Partner", (params) => ({
      ...params,
      initialTab: "Artworks",
    })),
    addRoute("/price-database", "PriceDatabase"),
    addRoute("/privacy-request", "PrivacyRequest"),
    addRoute("/purchase/:artworkID", "PurchaseModal"),
    addRoute("/recently-viewed", "RecentlyViewed"),
    addRoute("/reverse-image", "ReverseImage"),
    addRoute("/sales", "Sales"),
    addRoute("/search", "Search"),
    addRoute("/search2", "Search2"),
    addRoute("/sell/inquiry", "ConsignmentInquiry"),
    addRoute("/selling-with-artsy", "MyCollectionSellingWithartsyFAQ"),
    addRoute("/settings/dark-mode", "DarkModeSettings"),
    addRoute("/show/:showID", "Show"),
    addRoute("/show/:showID/info", "ShowMoreInfo"),
    addRoute("/similar-to-recently-viewed", "SimilarToRecentlyViewed"),
    addRoute("/storybook", "Storybook"),
    addRoute("/tag/:tagID", "Tag"),
    addRoute("/unlisted-artworks-faq", "UnlistedArtworksFAQScreen"),
    addRoute("/upcoming-auction-results", "UpcomingAuctionResults"),
    addRoute("/user/conversations/:conversationID", "Conversation"),
    addRoute("/user/purchases/:orderID", "OrderDetails"),
    addRoute("/viewing-room/:viewing_room_id", "ViewingRoom"),
    addRoute("/viewing-room/:viewing_room_id/artworks", "ViewingRoomArtworks"),
    addRoute("/viewing-room/:viewing_room_id/:artwork_id", "ViewingRoomArtwork"),
    addRoute("/viewing-rooms", "ViewingRooms"),
    addRoute("/works-for-you", "WorksForYou"),

    // Webview routes
    addWebViewRoute("/article/:articleID", { showShareButton: true }),
    addWebViewRoute("/articles/:articleID"),
    addWebViewRoute("/auction-faq"),
    addWebViewRoute("/buy-now-feature-faq"),
    addWebViewRoute("/buyer-guarantee"),
    addWebViewRoute("/categories"),
    addWebViewRoute("/conditions-of-sale"),
    addWebViewRoute("/identity-verification-faq"),
    addWebViewRoute("/meet-the-specialists"),
    addWebViewRoute("/orders/:orderID", {
      mimicBrowserBackButton: true,
      useRightCloseButton: true,
    }),
    addWebViewRoute("/price-database"),
    addWebViewRoute("/privacy"),
    addWebViewRoute("/terms"),
    addWebViewRoute("/unsubscribe"),

    // Every other route needs to go above
    addRoute("/:slug", "VanityURLEntity"),
    addWebViewRoute("/*"),
  ])

  const routesForDomain = {
    "live.artsy.net": liveDotArtsyDotNet,
    "live-staging.artsy.net": liveDotArtsyDotNet,
    "staging.artsy.net": artsyDotNet,
    "artsy.net": artsyDotNet,
    "www.artsy.net": artsyDotNet,
    [parse(unsafe__getEnvironment().webURL).host ?? "artsy.net"]: artsyDotNet,
  }

  return routesForDomain
}
