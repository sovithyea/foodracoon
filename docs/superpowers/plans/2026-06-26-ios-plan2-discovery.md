# FoodRaccoon iOS — Plan 2: Discovery

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plan 1 (Foundation) complete and running on device.

**Goal:** Implement the core discovery features — Mapbox map with colored markers, RestaurantPanel bottom sheet, filter system, restaurant detail view with rating, and search (restaurants + people).

**Architecture:** `RestaurantStore` (`@Observable`) fetches all restaurants on launch via paginated Supabase calls, caches in memory for 30 min, and drives the Mapbox `Map` view reactively. `RestaurantPanel` is a `.sheet` with `.presentationDetents`. `SearchView` debounces 300ms across two parallel Supabase queries.

**Tech Stack:** SwiftUI, MapboxMaps v11, supabase-swift, Observation, XCTest

## Global Constraints

- iOS 17.0+, Swift 5.9+, `@Observable` stores
- All Supabase calls use async/await
- `supabase` singleton from `SupabaseClient.swift` (Plan 1)
- Models from `Models.swift` (Plan 1): `Restaurant`, `RestaurantStatus`, `UserRestaurant`, `UserProfile`
- Theme from `Theme.swift` (Plan 1): `Color.frAccent`, `Color.frBackground`, `Color.frCard`, `Color.frText`, `Color.frBorder`
- Chalk Market palette: bg `#F5F0E8` · card `#EDE6D8` · accent `#D44C2A` · text `#2C2420` · border `#D4C8B4`
- Phnom Penh map center: latitude 11.5625, longitude 104.916, zoom 12
- Marker colors: red (unsaved) · orange (want_to_try) · green (visited) · amber (favourite)

---

### Task 1: UIImage+Circle Extension

**Files:**
- Create: `FoodRaccoon/Shared/Extensions/UIImage+Circle.swift`
- Test: `FoodRaccoonTests/UIImageCircleTests.swift`

**Interfaces:**
- Produces: `UIImage.filledCircle(diameter:color:) -> UIImage` — used by MapView for marker images

- [ ] **Step 1: Write failing test**

Create `FoodRaccoonTests/UIImageCircleTests.swift`:

```swift
import XCTest
import UIKit
@testable import FoodRaccoon

final class UIImageCircleTests: XCTestCase {
    func testCircleImageHasCorrectSize() {
        let img = UIImage.filledCircle(diameter: 16, color: .red)
        XCTAssertEqual(img.size.width, 16)
        XCTAssertEqual(img.size.height, 16)
    }

    func testCircleImageIsNotNil() {
        let img = UIImage.filledCircle(diameter: 24, color: .blue)
        XCTAssertNotNil(img)
    }
}
```

- [ ] **Step 2: Run — expect failure**

Cmd+U. Fails: `filledCircle` not defined.

- [ ] **Step 3: Create UIImage+Circle.swift**

```swift
import UIKit

extension UIImage {
    static func filledCircle(diameter: CGFloat, color: UIColor) -> UIImage {
        let size = CGSize(width: diameter, height: diameter)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            color.setFill()
            ctx.cgContext.fillEllipse(in: CGRect(origin: .zero, size: size))
        }
    }
}
```

- [ ] **Step 4: Run tests — expect pass**

Cmd+U. UIImageCircleTests pass.

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Shared/Extensions/UIImage+Circle.swift \
        FoodRaccoonTests/UIImageCircleTests.swift
git commit -m "feat: UIImage.filledCircle for map markers"
```

---

### Task 2: RestaurantStore

**Files:**
- Create: `FoodRaccoon/Shared/RestaurantStore.swift`
- Test: `FoodRaccoonTests/RestaurantStoreTests.swift`

**Interfaces:**
- Produces: `RestaurantStore` — `@Observable`, `@MainActor`
- Produces: `.restaurants: [Restaurant]`, `.statusMap: [String: RestaurantStatus]`, `.selectedId: String?`
- Produces: `.searchFilterIds: Set<String>?`, `.activeCuisines: Set<String>`, `.activePrices: Set<Int>`
- Produces: `.filteredRestaurants: [Restaurant]` (computed)
- Produces: `.isLoading: Bool`, `.lastFetched: Date?`
- Produces: `fetchRestaurants() async`, `fetchStatusMap(userId:) async`, `clearStatusMap()`
- Produces: `setSearchFilter(_ ids: Set<String>?)`, `clearFilters()`

- [ ] **Step 1: Write failing tests**

Create `FoodRaccoonTests/RestaurantStoreTests.swift`:

```swift
import XCTest
@testable import FoodRaccoon

@MainActor
final class RestaurantStoreTests: XCTestCase {
    func testInitialState() {
        let store = RestaurantStore()
        XCTAssertTrue(store.restaurants.isEmpty)
        XCTAssertTrue(store.statusMap.isEmpty)
        XCTAssertNil(store.selectedId)
        XCTAssertNil(store.searchFilterIds)
        XCTAssertFalse(store.isLoading)
    }

    func testFilteredRestaurantsNoCuisineFilter() {
        let store = RestaurantStore()
        store.restaurants = [
            makeRestaurant(id: "1", cuisine: ["BBQ"], price: 2),
            makeRestaurant(id: "2", cuisine: ["Thai"], price: 3),
        ]
        XCTAssertEqual(store.filteredRestaurants.count, 2)
    }

    func testFilteredRestaurantsByCuisine() {
        let store = RestaurantStore()
        store.restaurants = [
            makeRestaurant(id: "1", cuisine: ["BBQ"], price: 2),
            makeRestaurant(id: "2", cuisine: ["Thai"], price: 3),
        ]
        store.activeCuisines = ["BBQ"]
        XCTAssertEqual(store.filteredRestaurants.count, 1)
        XCTAssertEqual(store.filteredRestaurants[0].id, "1")
    }

    func testFilteredRestaurantsByPrice() {
        let store = RestaurantStore()
        store.restaurants = [
            makeRestaurant(id: "1", cuisine: ["BBQ"], price: 2),
            makeRestaurant(id: "2", cuisine: ["Thai"], price: 3),
        ]
        store.activePrices = [2]
        XCTAssertEqual(store.filteredRestaurants.count, 1)
        XCTAssertEqual(store.filteredRestaurants[0].id, "1")
    }

    func testSearchFilterOverridesOtherFilters() {
        let store = RestaurantStore()
        store.restaurants = [
            makeRestaurant(id: "1", cuisine: ["BBQ"], price: 2),
            makeRestaurant(id: "2", cuisine: ["Thai"], price: 3),
        ]
        store.activeCuisines = ["BBQ"]
        store.searchFilterIds = ["2"]
        XCTAssertEqual(store.filteredRestaurants.count, 1)
        XCTAssertEqual(store.filteredRestaurants[0].id, "2")
    }

    func testCacheIsStaleAfterTTL() {
        let store = RestaurantStore()
        store.lastFetched = Date(timeIntervalSinceNow: -1900) // > 30 min
        XCTAssertTrue(store.isCacheStale)
    }

    func testCacheIsFreshWithinTTL() {
        let store = RestaurantStore()
        store.lastFetched = Date(timeIntervalSinceNow: -60)
        XCTAssertFalse(store.isCacheStale)
    }

    // MARK: - Helpers

    private func makeRestaurant(id: String, cuisine: [String], price: Int) -> Restaurant {
        // Decode from minimal JSON to avoid needing a public memberwise init
        let json = """
        {"id":"\(id)","name":"Test","cuisine_type":\(cuisine.map { "\"\($0)\"" }),"district":null,
         "latitude":11.56,"longitude":104.92,"cover_photo_url":null,"price_range":\(price),
         "tags":[],"saves_count":0,"is_verified":false,"address":null,"phone":null,
         "website":null,"google_rating":null,"google_rating_count":null,
         "google_place_id":null,"opening_hours":null,"created_at":"2024-01-01T00:00:00Z"}
        """.data(using: .utf8)!
        return try! JSONDecoder().decode(Restaurant.self, from: json)
    }
}
```

- [ ] **Step 2: Run — expect failure**

Cmd+U. Fails: `RestaurantStore` not defined.

- [ ] **Step 3: Create RestaurantStore.swift**

```swift
import Supabase
import Observation

private let restaurantsTTL: TimeInterval = 30 * 60 // 30 minutes

@Observable
@MainActor
class RestaurantStore {
    var restaurants: [Restaurant] = []
    var statusMap: [String: RestaurantStatus] = [:]
    var selectedId: String? = nil
    var searchFilterIds: Set<String>? = nil
    var activeCuisines: Set<String> = []
    var activePrices: Set<Int> = []
    var isLoading = false
    var lastFetched: Date? = nil

    var isCacheStale: Bool {
        guard let last = lastFetched else { return true }
        return Date().timeIntervalSince(last) > restaurantsTTL
    }

    var filteredRestaurants: [Restaurant] {
        var base = restaurants

        // Search filter overrides cuisine/price filters
        if let ids = searchFilterIds {
            return base.filter { ids.contains($0.id) }
        }

        if !activeCuisines.isEmpty {
            base = base.filter { !$0.cuisineType.filter { activeCuisines.contains($0) }.isEmpty }
        }
        if !activePrices.isEmpty {
            base = base.filter { price in
                guard let p = price.priceRange else { return false }
                return activePrices.contains(p)
            }
        }
        return base
    }

    var allCuisines: [String] {
        Array(Set(restaurants.flatMap { $0.cuisineType })).sorted()
    }

    func fetchRestaurants() async {
        guard isCacheStale else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            restaurants = try await fetchAll()
            lastFetched = Date()
        } catch {
            print("[RestaurantStore] fetch error: \(error)")
        }
    }

    func fetchStatusMap(userId: String) async {
        do {
            let rows: [UserRestaurant] = try await supabase
                .from("user_restaurants")
                .select()
                .eq("user_id", value: userId)
                .execute()
                .value
            var map: [String: RestaurantStatus] = [:]
            for row in rows {
                if let s = row.status { map[row.restaurantId] = s }
            }
            statusMap = map
        } catch {
            print("[RestaurantStore] statusMap error: \(error)")
        }
    }

    func clearStatusMap() {
        statusMap = [:]
    }

    func setSearchFilter(_ ids: Set<String>?) {
        searchFilterIds = ids
    }

    func clearFilters() {
        activeCuisines = []
        activePrices = []
        searchFilterIds = nil
    }

    // MARK: - Private

    private func fetchAll() async throws -> [Restaurant] {
        let countResponse = try await supabase
            .from("restaurants")
            .select("id", head: true, count: .exact)
            .execute()

        let total = countResponse.count ?? 0
        guard total > 0 else { return [] }

        let pageSize = 1000
        let pageCount = Int(ceil(Double(total) / Double(pageSize)))

        return try await withThrowingTaskGroup(of: [Restaurant].self) { group in
            for page in 0..<pageCount {
                let from = page * pageSize
                let to = min(from + pageSize - 1, total - 1)
                group.addTask {
                    try await supabase
                        .from("restaurants")
                        .select()
                        .range(from: from, to: to)
                        .execute()
                        .value
                }
            }
            var all: [Restaurant] = []
            for try await batch in group { all.append(contentsOf: batch) }
            return all
        }
    }
}
```

- [ ] **Step 4: Run tests — expect pass**

Cmd+U. RestaurantStoreTests pass.

- [ ] **Step 5: Inject RestaurantStore into app**

In `FoodRaccoon/App/FoodRaccoonApp.swift`, add `@State private var restaurantStore = RestaurantStore()` and pass `.environment(restaurantStore)`:

```swift
@main
struct FoodRaccoonApp: App {
    @State private var authStore = AuthStore()
    @State private var restaurantStore = RestaurantStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authStore)
                .environment(restaurantStore)
                .onAppear {
                    authStore.startObservingAuthChanges()
                }
        }
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add FoodRaccoon/Shared/RestaurantStore.swift \
        FoodRaccoon/App/FoodRaccoonApp.swift \
        FoodRaccoonTests/RestaurantStoreTests.swift
git commit -m "feat: RestaurantStore with paginated fetch, TTL cache, filters"
```

---

### Task 3: MapStore

**Files:**
- Create: `FoodRaccoon/Shared/MapStore.swift`

**Interfaces:**
- Produces: `MapStore` — `@Observable`
- Produces: `.styleId: String` (`"light"` / `"dark"` / `"streets"` / `"satellite"`)
- Produces: `.userLocation: CLLocationCoordinate2D?`
- Produces: `mapboxStyleURI: StyleURI` — computed from styleId

- [ ] **Step 1: Create MapStore.swift**

```swift
import MapboxMaps
import CoreLocation
import Observation

@Observable
class MapStore {
    var styleId: String {
        didSet { UserDefaults.standard.set(styleId, forKey: "mapStyleId") }
    }
    var userLocation: CLLocationCoordinate2D? = nil

    init() {
        styleId = UserDefaults.standard.string(forKey: "mapStyleId") ?? "streets"
    }

    var mapboxStyleURI: StyleURI {
        switch styleId {
        case "light":     return .light
        case "dark":      return .dark
        case "satellite": return .satelliteStreets
        default:          return .streets
        }
    }
}
```

- [ ] **Step 2: Inject MapStore into app**

In `FoodRaccoonApp.swift`, add `@State private var mapStore = MapStore()` and pass `.environment(mapStore)`:

```swift
@main
struct FoodRaccoonApp: App {
    @State private var authStore = AuthStore()
    @State private var restaurantStore = RestaurantStore()
    @State private var mapStore = MapStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authStore)
                .environment(restaurantStore)
                .environment(mapStore)
                .onAppear { authStore.startObservingAuthChanges() }
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add FoodRaccoon/Shared/MapStore.swift FoodRaccoon/App/FoodRaccoonApp.swift
git commit -m "feat: MapStore with style persistence"
```

---

### Task 4: MapView

**Files:**
- Create: `FoodRaccoon/Map/MapView.swift`
- Modify: `FoodRaccoon/App/MainTabView.swift`

**Interfaces:**
- Consumes: `RestaurantStore.filteredRestaurants`, `RestaurantStore.statusMap`, `RestaurantStore.selectedId`, `RestaurantStore.fetchRestaurants()`
- Consumes: `MapStore.mapboxStyleURI`
- Consumes: `AuthStore.session` (to trigger statusMap fetch)
- Produces: `MapView` — Mapbox map with colored PointAnnotations; tapping sets `restaurantStore.selectedId`

- [ ] **Step 1: Create MapView.swift**

```swift
import SwiftUI
import MapboxMaps
import CoreLocation

struct MapView: View {
    @Environment(RestaurantStore.self) private var restaurantStore
    @Environment(MapStore.self) private var mapStore
    @Environment(AuthStore.self) private var authStore

    @State private var viewport = Viewport.camera(
        center: CLLocationCoordinate2D(latitude: 11.5625, longitude: 104.916),
        zoom: 12
    )

    var body: some View {
        ZStack(alignment: .top) {
            Map(viewport: $viewport, style: mapStore.mapboxStyleURI) {
                PointAnnotationGroup(restaurantStore.filteredRestaurants, id: \.id) { restaurant in
                    let status = restaurantStore.statusMap[restaurant.id]
                    PointAnnotation(coordinate: CLLocationCoordinate2D(
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude
                    ))
                    .image(.init(
                        image: markerImage(for: status),
                        name: markerName(for: status)
                    ))
                }
                .onTapGesture { annotation, _ in
                    restaurantStore.selectedId = annotation.id
                }
            }
            .ignoresSafeArea()

            FilterBar()
                .padding(.horizontal)
                .padding(.top, 8)
        }
        .task {
            await restaurantStore.fetchRestaurants()
            if let uid = authStore.session?.user.id.uuidString {
                await restaurantStore.fetchStatusMap(userId: uid)
            }
        }
        .onChange(of: authStore.session) { _, session in
            if let uid = session?.user.id.uuidString {
                Task { await restaurantStore.fetchStatusMap(userId: uid) }
            } else {
                restaurantStore.clearStatusMap()
            }
        }
        .sheet(isPresented: .init(
            get: { restaurantStore.selectedId != nil },
            set: { if !$0 { restaurantStore.selectedId = nil } }
        )) {
            if let id = restaurantStore.selectedId,
               let restaurant = restaurantStore.restaurants.first(where: { $0.id == id }) {
                RestaurantPanel(restaurant: restaurant)
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
                    .presentationBackgroundInteraction(.enabled(upThrough: .medium))
            }
        }
    }

    // MARK: - Marker helpers

    private func markerImage(for status: RestaurantStatus?) -> UIImage {
        UIImage.filledCircle(diameter: 14, color: markerUIColor(for: status))
    }

    private func markerName(for status: RestaurantStatus?) -> String {
        switch status {
        case .wantToTry: return "marker-orange"
        case .visited:   return "marker-green"
        case .favourite: return "marker-amber"
        case nil:        return "marker-red"
        }
    }

    private func markerUIColor(for status: RestaurantStatus?) -> UIColor {
        switch status {
        case .wantToTry: return UIColor(red: 1.0, green: 0.60, blue: 0.0, alpha: 1) // orange
        case .visited:   return UIColor(red: 0.13, green: 0.60, blue: 0.13, alpha: 1) // green
        case .favourite: return UIColor(red: 1.0, green: 0.75, blue: 0.0, alpha: 1) // amber
        case nil:        return UIColor(red: 0.83, green: 0.30, blue: 0.16, alpha: 1) // frAccent red
        }
    }
}

#Preview {
    MapView()
        .environment(RestaurantStore())
        .environment(MapStore())
        .environment(AuthStore())
}
```

- [ ] **Step 2: Update MainTabView — wire Map tab**

Replace the Map tab in `MainTabView.swift`:

```swift
NavigationStack {
    MapView()
        .navigationBarHidden(true)
}
.tabItem { Label("Map", systemImage: "map.fill") }
```

- [ ] **Step 3: Build and run**

Cmd+R. Map tab shows Mapbox map centered on Phnom Penh. Markers appear after ~1–2s. Tapping a marker shows the sheet stub (RestaurantPanel is a stub until Task 5).

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Map/MapView.swift FoodRaccoon/App/MainTabView.swift
git commit -m "feat: MapView with Mapbox, colored markers, restaurant fetch"
```

---

### Task 5: RestaurantPanel

**Files:**
- Create: `FoodRaccoon/Map/RestaurantPanel.swift`

**Interfaces:**
- Consumes: `Restaurant`, `RestaurantStore.statusMap`
- Produces: `RestaurantPanel(restaurant:)` — bottom sheet with medium/large detents

- [ ] **Step 1: Create RestaurantPanel.swift**

```swift
import SwiftUI

struct RestaurantPanel: View {
    let restaurant: Restaurant
    @Environment(RestaurantStore.self) private var restaurantStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Cover image
                    if let url = restaurant.coverPhotoUrl {
                        AsyncImage(url: URL(string: url)) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Color.frCard
                        }
                        .frame(height: 200)
                        .clipped()
                    } else {
                        Color.frCard.frame(height: 160)
                            .overlay(
                                Image(systemName: "fork.knife")
                                    .font(.system(size: 40))
                                    .foregroundStyle(Color.frBorder)
                            )
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        // Name + meta
                        VStack(alignment: .leading, spacing: 4) {
                            Text(restaurant.name)
                                .font(.title2.bold())
                                .foregroundStyle(Color.frText)

                            HStack(spacing: 8) {
                                if !restaurant.cuisineType.isEmpty {
                                    Text(restaurant.cuisineType.joined(separator: ", "))
                                        .font(.subheadline)
                                        .foregroundStyle(Color.frText.opacity(0.7))
                                }
                                if let price = restaurant.priceRange {
                                    Text("·").foregroundStyle(Color.frText.opacity(0.4))
                                    Text(String(repeating: "$", count: price))
                                        .font(.subheadline)
                                        .foregroundStyle(Color.frText.opacity(0.7))
                                }
                                if let district = restaurant.district {
                                    Text("·").foregroundStyle(Color.frText.opacity(0.4))
                                    Text(district)
                                        .font(.subheadline)
                                        .foregroundStyle(Color.frText.opacity(0.7))
                                }
                            }
                        }

                        // Status badge
                        if let status = restaurantStore.statusMap[restaurant.id] {
                            StatusBadge(status: status)
                        }

                        Divider().foregroundStyle(Color.frBorder)

                        // Rating section (stub — replaced in Task 8)
                        RatingSectionStub(restaurant: restaurant)

                        Divider().foregroundStyle(Color.frBorder)

                        // Actions
                        HStack(spacing: 12) {
                            if let address = restaurant.address {
                                Button {
                                    let encoded = address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
                                    if let url = URL(string: "maps://?q=\(encoded)") {
                                        UIApplication.shared.open(url)
                                    }
                                } label: {
                                    Label("Directions", systemImage: "arrow.triangle.turn.up.right.circle")
                                        .font(.subheadline)
                                        .foregroundStyle(Color.frAccent)
                                }
                            }

                            if let website = restaurant.website, let url = URL(string: website) {
                                Link(destination: url) {
                                    Label("Website", systemImage: "globe")
                                        .font(.subheadline)
                                        .foregroundStyle(Color.frAccent)
                                }
                            }

                            if let phone = restaurant.phone {
                                Button {
                                    if let url = URL(string: "tel:\(phone)") {
                                        UIApplication.shared.open(url)
                                    }
                                } label: {
                                    Label("Call", systemImage: "phone")
                                        .font(.subheadline)
                                        .foregroundStyle(Color.frAccent)
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
            .background(Color.frBackground)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(Color.frText.opacity(0.4))
                    }
                }
            }
        }
    }
}

// Stub replaced in Task 8
struct RatingSectionStub: View {
    let restaurant: Restaurant
    var body: some View {
        Text("Rating — coming in Task 8")
            .font(.caption)
            .foregroundStyle(Color.frText.opacity(0.4))
    }
}

struct StatusBadge: View {
    let status: RestaurantStatus

    private var color: Color {
        switch status {
        case .wantToTry: return Color(hex: "#FF9900")
        case .visited:   return Color(hex: "#22AA22")
        case .favourite: return Color(hex: "#FFBB00")
        }
    }

    var body: some View {
        Label(status.label, systemImage: status.systemImage)
            .font(.caption.bold())
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.15))
            .cornerRadius(20)
    }
}

#Preview {
    RestaurantPanel(restaurant: .preview)
        .environment(RestaurantStore())
        .environment(AuthStore())
}
```

Add preview helper to `Models.swift` (at bottom of file):

```swift
extension Restaurant {
    static var preview: Restaurant {
        try! JSONDecoder().decode(Restaurant.self, from: """
        {"id":"preview","name":"Romdeng","cuisine_type":["Khmer"],"district":"Daun Penh",
         "latitude":11.5639,"longitude":104.9282,"cover_photo_url":null,"price_range":3,
         "tags":["fine dining"],"saves_count":128,"is_verified":true,"address":"74 St 174",
         "phone":null,"website":null,"google_rating":4.5,"google_rating_count":342,
         "google_place_id":null,"opening_hours":null,"created_at":"2024-01-01T00:00:00Z"}
        """.data(using: .utf8)!)
    }
}
```

- [ ] **Step 2: Build and run**

Cmd+R. Tap map marker → panel slides up as bottom sheet. Shows restaurant name, cuisine, status badge if set. Swipe up → expands to full. ✓

- [ ] **Step 3: Commit**

```bash
git add FoodRaccoon/Map/RestaurantPanel.swift FoodRaccoon/Shared/Models.swift
git commit -m "feat: RestaurantPanel bottom sheet with status badge and actions"
```

---

### Task 6: FilterBar + FilterSheet

**Files:**
- Create: `FoodRaccoon/Map/FilterBar.swift`
- Create: `FoodRaccoon/Map/FilterSheet.swift`

**Interfaces:**
- Consumes: `RestaurantStore.activeCuisines`, `RestaurantStore.activePrices`, `RestaurantStore.allCuisines`, `RestaurantStore.clearFilters()`
- Produces: `FilterBar` — horizontal chip bar at top of map; opens `FilterSheet`

- [ ] **Step 1: Create FilterSheet.swift**

```swift
import SwiftUI

struct FilterSheet: View {
    @Environment(RestaurantStore.self) private var restaurantStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var store = restaurantStore
        NavigationStack {
            List {
                Section("Cuisine") {
                    ForEach(restaurantStore.allCuisines, id: \.self) { cuisine in
                        Button {
                            if restaurantStore.activeCuisines.contains(cuisine) {
                                restaurantStore.activeCuisines.remove(cuisine)
                            } else {
                                restaurantStore.activeCuisines.insert(cuisine)
                            }
                        } label: {
                            HStack {
                                Text(cuisine).foregroundStyle(Color.frText)
                                Spacer()
                                if restaurantStore.activeCuisines.contains(cuisine) {
                                    Image(systemName: "checkmark").foregroundStyle(Color.frAccent)
                                }
                            }
                        }
                    }
                }

                Section("Price") {
                    ForEach(1...4, id: \.self) { price in
                        Button {
                            if restaurantStore.activePrices.contains(price) {
                                restaurantStore.activePrices.remove(price)
                            } else {
                                restaurantStore.activePrices.insert(price)
                            }
                        } label: {
                            HStack {
                                Text(String(repeating: "$", count: price)).foregroundStyle(Color.frText)
                                Spacer()
                                if restaurantStore.activePrices.contains(price) {
                                    Image(systemName: "checkmark").foregroundStyle(Color.frAccent)
                                }
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.frBackground)
            .navigationTitle("Filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Clear all") { restaurantStore.clearFilters() }
                        .foregroundStyle(Color.frAccent)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color.frAccent)
                        .fontWeight(.semibold)
                }
            }
        }
    }
}
```

- [ ] **Step 2: Create FilterBar.swift**

```swift
import SwiftUI

struct FilterBar: View {
    @Environment(RestaurantStore.self) private var restaurantStore
    @State private var showFilter = false

    private var hasActiveFilters: Bool {
        !restaurantStore.activeCuisines.isEmpty || !restaurantStore.activePrices.isEmpty
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // Filter button
                Button {
                    showFilter = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "slider.horizontal.3")
                        Text("Filter")
                    }
                    .font(.caption.bold())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(hasActiveFilters ? Color.frAccent : Color.frCard)
                    .foregroundStyle(hasActiveFilters ? .white : Color.frText)
                    .cornerRadius(20)
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.frBorder, lineWidth: hasActiveFilters ? 0 : 1))
                    .shadow(color: .black.opacity(0.08), radius: 3, y: 1)
                }

                // Active cuisine chips
                ForEach(Array(restaurantStore.activeCuisines).sorted(), id: \.self) { cuisine in
                    chip(cuisine) { restaurantStore.activeCuisines.remove(cuisine) }
                }

                // Active price chips
                ForEach(Array(restaurantStore.activePrices).sorted(), id: \.self) { price in
                    chip(String(repeating: "$", count: price)) { restaurantStore.activePrices.remove(price) }
                }
            }
            .padding(.horizontal, 4)
        }
        .sheet(isPresented: $showFilter) {
            FilterSheet()
                .environment(restaurantStore)
                .presentationDetents([.medium, .large])
        }
    }

    private func chip(_ label: String, onRemove: @escaping () -> Void) -> some View {
        HStack(spacing: 4) {
            Text(label).font(.caption.bold())
            Button { onRemove() } label: {
                Image(systemName: "xmark").font(.caption2)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.frAccent.opacity(0.15))
        .foregroundStyle(Color.frAccent)
        .cornerRadius(20)
    }
}
```

- [ ] **Step 3: Build and run**

Cmd+R. Filter button visible at top of map. Tap → FilterSheet with cuisines and price options. Select filters → chips appear in FilterBar. Markers update. Clear all → all markers show. ✓

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Map/FilterBar.swift FoodRaccoon/Map/FilterSheet.swift
git commit -m "feat: FilterBar and FilterSheet for cuisine and price filtering"
```

---

### Task 7: MapStylePicker

**Files:**
- Create: `FoodRaccoon/Map/MapStylePicker.swift`
- Modify: `FoodRaccoon/Map/MapView.swift`

**Interfaces:**
- Consumes: `MapStore.styleId`
- Produces: `MapStylePicker` — compact button that toggles map styles; integrated into MapView overlay

- [ ] **Step 1: Create MapStylePicker.swift**

```swift
import SwiftUI

struct MapStylePicker: View {
    @Environment(MapStore.self) private var mapStore
    @State private var showPicker = false

    private let styles: [(id: String, label: String, icon: String)] = [
        ("streets", "Streets", "map"),
        ("light", "Light", "sun.max"),
        ("dark", "Dark", "moon"),
        ("satellite", "Satellite", "globe.americas.fill"),
    ]

    var body: some View {
        Button { showPicker.toggle() } label: {
            Image(systemName: "map.circle.fill")
                .font(.title2)
                .foregroundStyle(Color.frAccent)
                .padding(8)
                .background(Color.frCard)
                .cornerRadius(10)
                .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
        }
        .popover(isPresented: $showPicker) {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(styles, id: \.id) { style in
                    Button {
                        mapStore.styleId = style.id
                        showPicker = false
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: style.icon)
                                .frame(width: 20)
                                .foregroundStyle(Color.frAccent)
                            Text(style.label)
                                .foregroundStyle(Color.frText)
                            Spacer()
                            if mapStore.styleId == style.id {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Color.frAccent)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                    if style.id != styles.last?.id {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .frame(width: 200)
            .background(Color.frCard)
            .presentationCompactAdaptation(.popover)
        }
    }
}
```

- [ ] **Step 2: Add MapStylePicker to MapView overlay**

In `MapView.swift`, update the `ZStack` overlay to include the style picker in the bottom-right corner:

```swift
ZStack(alignment: .top) {
    Map(viewport: $viewport, style: mapStore.mapboxStyleURI) { ... }
        .ignoresSafeArea()

    FilterBar()
        .padding(.horizontal)
        .padding(.top, 8)
    
    // Add at bottom-right:
    VStack {
        Spacer()
        HStack {
            Spacer()
            MapStylePicker()
                .padding(.trailing, 16)
                .padding(.bottom, 24)
        }
    }
}
```

- [ ] **Step 3: Build and run**

Cmd+R. Map circle button at bottom-right. Tap → popover with 4 styles. Select Satellite → map changes. Setting persists across launches. ✓

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Map/MapStylePicker.swift FoodRaccoon/Map/MapView.swift
git commit -m "feat: MapStylePicker with 4 styles, persisted in UserDefaults"
```

---

### Task 8: AuthGateButton + RatingSection

**Files:**
- Create: `FoodRaccoon/Shared/AuthGateButton.swift`
- Create: `FoodRaccoon/Restaurant/RatingSection.swift`
- Modify: `FoodRaccoon/Map/RestaurantPanel.swift`

**Interfaces:**
- Produces: `AuthGateButton(action:label:)` — fires login sheet if no session, else executes action
- Produces: `RatingSection(restaurant:)` — status picker + 1–10 rating slider + upsert to Supabase

- [ ] **Step 1: Create AuthGateButton.swift**

```swift
import SwiftUI

struct AuthGateButton<Label: View>: View {
    @Environment(AuthStore.self) private var authStore
    let action: () async -> Void
    let label: () -> Label
    @State private var showLogin = false

    init(action: @escaping () async -> Void, @ViewBuilder label: @escaping () -> Label) {
        self.action = action
        self.label = label
    }

    var body: some View {
        Button {
            if authStore.session != nil {
                Task { await action() }
            } else {
                showLogin = true
            }
        } label: {
            label()
        }
        .sheet(isPresented: $showLogin) {
            LoginView(isDismissable: true)
                .environment(authStore)
        }
    }
}
```

- [ ] **Step 2: Create RatingSection.swift**

```swift
import SwiftUI

struct RatingSection: View {
    let restaurant: Restaurant
    @Environment(RestaurantStore.self) private var restaurantStore
    @Environment(AuthStore.self) private var authStore
    @State private var rating: Double = 0
    @State private var isSaving = false
    @State private var showAddToList = false

    private var currentStatus: RestaurantStatus? {
        restaurantStore.statusMap[restaurant.id]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Status buttons
            HStack(spacing: 10) {
                ForEach(RestaurantStatus.allCases, id: \.self) { status in
                    AuthGateButton(action: { await setStatus(status) }) {
                        VStack(spacing: 4) {
                            Image(systemName: status.systemImage + (currentStatus == status ? ".fill" : ""))
                                .font(.title3)
                            Text(status.label)
                                .font(.caption2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(currentStatus == status ? Color.frAccent : Color.frCard)
                        .foregroundStyle(currentStatus == status ? .white : Color.frText)
                        .cornerRadius(10)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.frBorder, lineWidth: currentStatus == status ? 0 : 1))
                    }
                }
            }

            // Rating slider (only shown when status is set)
            if currentStatus != nil {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Your rating")
                            .font(.subheadline)
                            .foregroundStyle(Color.frText.opacity(0.7))
                        Spacer()
                        Text(rating > 0 ? String(format: "%.0f/10", rating) : "Not rated")
                            .font(.subheadline.bold())
                            .foregroundStyle(rating > 0 ? Color.frAccent : Color.frText.opacity(0.4))
                    }
                    Slider(value: $rating, in: 0...10, step: 1)
                        .tint(Color.frAccent)
                        .onChange(of: rating) { _, _ in
                            Task { await saveRating() }
                        }
                }
            }

            // Add to list button
            AuthGateButton(action: { showAddToList = true }) {
                Label("Add to list", systemImage: "plus.circle")
                    .font(.subheadline)
                    .foregroundStyle(Color.frAccent)
            }
        }
        .onAppear { loadCurrentRating() }
        .sheet(isPresented: $showAddToList) {
            // Placeholder — wired up in Plan 3
            Text("Add to List — coming in Plan 3")
                .padding()
                .presentationDetents([.medium])
        }
    }

    private func loadCurrentRating() {
        guard let uid = authStore.session?.user.id.uuidString else { return }
        Task {
            do {
                let rows: [UserRestaurant] = try await supabase
                    .from("user_restaurants")
                    .select()
                    .eq("user_id", value: uid)
                    .eq("restaurant_id", value: restaurant.id)
                    .execute()
                    .value
                if let row = rows.first, let r = row.rating {
                    rating = Double(r)
                }
            } catch {}
        }
    }

    private func setStatus(_ status: RestaurantStatus) async {
        guard let uid = authStore.session?.user.id.uuidString else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            let current = restaurantStore.statusMap[restaurant.id]
            if current == status {
                // Toggle off — delete row
                try await supabase
                    .from("user_restaurants")
                    .delete()
                    .eq("user_id", value: uid)
                    .eq("restaurant_id", value: restaurant.id)
                    .execute()
                restaurantStore.statusMap.removeValue(forKey: restaurant.id)
                rating = 0
            } else {
                try await supabase
                    .from("user_restaurants")
                    .upsert([
                        "user_id": uid,
                        "restaurant_id": restaurant.id,
                        "status": status.rawValue,
                    ])
                    .execute()
                restaurantStore.statusMap[restaurant.id] = status
            }
        } catch {
            print("[RatingSection] setStatus error: \(error)")
        }
    }

    private func saveRating() async {
        guard let uid = authStore.session?.user.id.uuidString, rating > 0 else { return }
        do {
            try await supabase
                .from("user_restaurants")
                .upsert([
                    "user_id": uid,
                    "restaurant_id": restaurant.id,
                    "rating": Int(rating),
                ])
                .execute()
        } catch {
            print("[RatingSection] saveRating error: \(error)")
        }
    }
}
```

- [ ] **Step 3: Replace RatingSectionStub in RestaurantPanel.swift**

In `RestaurantPanel.swift`, replace `RatingSectionStub(restaurant: restaurant)` with:

```swift
RatingSection(restaurant: restaurant)
```

Add `import SwiftUI` at top if missing. Remove the `RatingSectionStub` struct.

- [ ] **Step 4: Build and run**

Cmd+R. Tap marker → panel → status buttons visible. Unauthenticated: tap status → login sheet appears. Authenticated: tap "Visited" → button fills, rating slider appears, drag → saves to Supabase. Marker color updates. ✓

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Shared/AuthGateButton.swift \
        FoodRaccoon/Restaurant/RatingSection.swift \
        FoodRaccoon/Map/RestaurantPanel.swift
git commit -m "feat: AuthGateButton, RatingSection with status + rating upsert"
```

---

### Task 9: RestaurantDetailView

**Files:**
- Create: `FoodRaccoon/Restaurant/RestaurantDetailView.swift`
- Modify: `FoodRaccoon/Map/RestaurantPanel.swift`

**Interfaces:**
- Consumes: `Restaurant`, `RatingSection`, `AuthGateButton`
- Produces: `RestaurantDetailView(restaurant:)` — full-screen detail pushed from panel and search results

- [ ] **Step 1: Create RestaurantDetailView.swift**

```swift
import SwiftUI

struct RestaurantDetailView: View {
    let restaurant: Restaurant
    @Environment(RestaurantStore.self) private var restaurantStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Cover image
                if let url = restaurant.coverPhotoUrl {
                    AsyncImage(url: URL(string: url)) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        Color.frCard
                    }
                    .frame(height: 240)
                    .clipped()
                } else {
                    Color.frCard.frame(height: 160)
                        .overlay(
                            Image(systemName: "fork.knife")
                                .font(.system(size: 48))
                                .foregroundStyle(Color.frBorder)
                        )
                }

                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(restaurant.name)
                                    .font(.title.bold())
                                    .foregroundStyle(Color.frText)

                                if !restaurant.cuisineType.isEmpty {
                                    Text(restaurant.cuisineType.joined(separator: " · "))
                                        .font(.subheadline)
                                        .foregroundStyle(Color.frText.opacity(0.7))
                                }
                            }
                            Spacer()
                            if let status = restaurantStore.statusMap[restaurant.id] {
                                StatusBadge(status: status)
                            }
                        }

                        HStack(spacing: 12) {
                            if let price = restaurant.priceRange {
                                Label(String(repeating: "$", count: price), systemImage: "banknote")
                                    .font(.caption)
                                    .foregroundStyle(Color.frText.opacity(0.6))
                            }
                            if let district = restaurant.district {
                                Label(district, systemImage: "mappin")
                                    .font(.caption)
                                    .foregroundStyle(Color.frText.opacity(0.6))
                            }
                            if let rating = restaurant.googleRating {
                                Label(String(format: "%.1f", rating), systemImage: "star.fill")
                                    .font(.caption)
                                    .foregroundStyle(.yellow)
                            }
                        }
                    }

                    Divider()

                    // Rating section
                    RatingSection(restaurant: restaurant)

                    Divider()

                    // Info
                    VStack(alignment: .leading, spacing: 12) {
                        if let address = restaurant.address {
                            infoRow(icon: "mappin.circle", text: address)
                        }
                        if let phone = restaurant.phone {
                            infoRow(icon: "phone", text: phone)
                        }
                        if let website = restaurant.website {
                            infoRow(icon: "globe", text: website)
                        }
                    }

                    // Tags
                    if !restaurant.tags.isEmpty {
                        FlowLayout(spacing: 8) {
                            ForEach(restaurant.tags, id: \.self) { tag in
                                Text(tag)
                                    .font(.caption)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(Color.frCard)
                                    .foregroundStyle(Color.frText.opacity(0.7))
                                    .cornerRadius(20)
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.frBorder))
                            }
                        }
                    }
                }
                .padding(16)
            }
        }
        .background(Color.frBackground)
        .navigationTitle(restaurant.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func infoRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .frame(width: 20)
                .foregroundStyle(Color.frAccent)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Color.frText.opacity(0.8))
        }
    }
}

// Simple flow layout for tags
struct FlowLayout: Layout {
    let spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0
        var row: CGFloat = 0
        var rowH: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if row + size.width > width, row > 0 {
                height += rowH + spacing
                row = 0; rowH = 0
            }
            row += size.width + spacing
            rowH = max(rowH, size.height)
        }
        return CGSize(width: width, height: height + rowH)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowH: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                y += rowH + spacing
                x = bounds.minX; rowH = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowH = max(rowH, size.height)
        }
    }
}

#Preview {
    NavigationStack {
        RestaurantDetailView(restaurant: .preview)
            .environment(RestaurantStore())
            .environment(AuthStore())
    }
}
```

- [ ] **Step 2: Add "See more" link in RestaurantPanel**

In `RestaurantPanel.swift`, add a `NavigationLink` to `RestaurantDetailView` inside the toolbar or below the rating section:

```swift
// Add to toolbar in RestaurantPanel:
ToolbarItem(placement: .topBarLeading) {
    NavigationLink(destination: RestaurantDetailView(restaurant: restaurant)
        .environment(restaurantStore)
        .environment(AuthStore())
    ) {
        Text("More")
            .font(.subheadline)
            .foregroundStyle(Color.frAccent)
    }
}
```

- [ ] **Step 3: Build and run**

Cmd+R. Panel → "More" → full RestaurantDetailView with all fields, rating section, tags. ✓

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Restaurant/RestaurantDetailView.swift FoodRaccoon/Map/RestaurantPanel.swift
git commit -m "feat: RestaurantDetailView with full detail, tags, info rows"
```

---

### Task 10: SearchView

**Files:**
- Create: `FoodRaccoon/Search/SearchView.swift`
- Modify: `FoodRaccoon/App/MainTabView.swift`

**Interfaces:**
- Consumes: `RestaurantStore.setSearchFilter(_:)`, `RestaurantStore.restaurants`
- Produces: `SearchView` — debounced search across restaurants (name, cuisine, district) + people (username, display_name); recent searches in UserDefaults

- [ ] **Step 1: Create SearchView.swift**

```swift
import SwiftUI

private let recentSearchesKey = "foodraccoon:recent-searches"
private let maxRecent = 8

struct SearchView: View {
    @Environment(RestaurantStore.self) private var restaurantStore
    @State private var query = ""
    @State private var restaurantResults: [Restaurant] = []
    @State private var peopleResults: [UserProfile] = []
    @State private var isSearching = false
    @State private var recentSearches: [String] = []
    @State private var debounceTask: Task<Void, Never>? = nil

    var body: some View {
        NavigationStack {
            List {
                if query.isEmpty {
                    if !recentSearches.isEmpty {
                        Section("Recent") {
                            ForEach(recentSearches, id: \.self) { term in
                                Button {
                                    query = term
                                } label: {
                                    Label(term, systemImage: "clock")
                                        .foregroundStyle(Color.frText)
                                }
                            }
                            Button("Clear") {
                                recentSearches = []
                                UserDefaults.standard.removeObject(forKey: recentSearchesKey)
                            }
                            .font(.caption)
                            .foregroundStyle(Color.frText.opacity(0.5))
                        }
                    }
                } else {
                    if isSearching {
                        HStack { Spacer(); ProgressView(); Spacer() }
                            .listRowBackground(Color.frBackground)
                    }

                    if !restaurantResults.isEmpty {
                        Section("Restaurants") {
                            ForEach(restaurantResults) { restaurant in
                                NavigationLink(destination: RestaurantDetailView(restaurant: restaurant)
                                    .environment(restaurantStore)
                                    .environment(AuthStore())
                                ) {
                                    RestaurantSearchRow(restaurant: restaurant)
                                }
                            }
                        }
                    }

                    if !peopleResults.isEmpty {
                        Section("People") {
                            ForEach(peopleResults) { profile in
                                NavigationLink(destination: PublicProfileView(username: profile.username ?? "")
                                ) {
                                    PeopleSearchRow(profile: profile)
                                }
                            }
                        }
                    }

                    if !isSearching && restaurantResults.isEmpty && peopleResults.isEmpty {
                        Text("No results for "\(query)"")
                            .foregroundStyle(Color.frText.opacity(0.5))
                            .listRowBackground(Color.frBackground)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.frBackground)
            .navigationTitle("Search")
            .searchable(text: $query, prompt: "Restaurants, people…")
            .onChange(of: query) { _, newValue in
                debounceTask?.cancel()
                guard !newValue.trimmingCharacters(in: .whitespaces).isEmpty else {
                    restaurantResults = []
                    peopleResults = []
                    return
                }
                debounceTask = Task {
                    try? await Task.sleep(for: .milliseconds(300))
                    guard !Task.isCancelled else { return }
                    await runSearch(query: newValue)
                }
            }
            .onAppear {
                recentSearches = UserDefaults.standard.stringArray(forKey: recentSearchesKey) ?? []
            }
        }
    }

    private func runSearch(query: String) async {
        isSearching = true
        defer { isSearching = false }

        let q = query.trimmingCharacters(in: .whitespaces).lowercased()

        // Search restaurants locally (already fetched)
        let restaurants = restaurantStore.restaurants.filter { r in
            r.name.lowercased().contains(q) ||
            r.cuisineType.contains { $0.lowercased().contains(q) } ||
            (r.district?.lowercased().contains(q) == true)
        }
        .prefix(10)

        // Search people via Supabase
        do {
            let people: [UserProfile] = try await supabase
                .from("profiles")
                .select()
                .or("username.ilike.%\(q)%,display_name.ilike.%\(q)%")
                .limit(8)
                .execute()
                .value

            await MainActor.run {
                restaurantResults = Array(restaurants)
                peopleResults = people
                saveRecentSearch(query)
            }
        } catch {
            await MainActor.run {
                restaurantResults = Array(restaurants)
                peopleResults = []
            }
        }
    }

    private func saveRecentSearch(_ term: String) {
        var recent = recentSearches.filter { $0 != term }
        recent.insert(term, at: 0)
        recentSearches = Array(recent.prefix(maxRecent))
        UserDefaults.standard.set(recentSearches, forKey: recentSearchesKey)
    }
}

struct RestaurantSearchRow: View {
    let restaurant: Restaurant
    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: restaurant.coverPhotoUrl.flatMap(URL.init)) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Color.frCard
            }
            .frame(width: 44, height: 44)
            .cornerRadius(8)
            .clipped()

            VStack(alignment: .leading, spacing: 2) {
                Text(restaurant.name).font(.subheadline.bold()).foregroundStyle(Color.frText)
                Text([restaurant.cuisineType.first, restaurant.district].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(Color.frText.opacity(0.6))
            }
        }
        .padding(.vertical, 4)
    }
}

struct PeopleSearchRow: View {
    let profile: UserProfile
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.frCard)
                .frame(width: 40, height: 40)
                .overlay(Text((profile.displayLabel.first.map(String.init)) ?? "?").font(.headline).foregroundStyle(Color.frText))

            VStack(alignment: .leading, spacing: 2) {
                Text(profile.displayLabel).font(.subheadline.bold()).foregroundStyle(Color.frText)
                if let username = profile.username {
                    Text("@\(username)").font(.caption).foregroundStyle(Color.frText.opacity(0.6))
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// Stub — replaced in Plan 3
struct PublicProfileView: View {
    let username: String
    var body: some View {
        Text("Profile: @\(username)").navigationTitle("@\(username)")
    }
}
```

- [ ] **Step 2: Wire Search tab in MainTabView**

In `MainTabView.swift`, replace the Search stub:

```swift
NavigationStack {
    SearchView()
}
.tabItem { Label("Search", systemImage: "magnifyingglass") }
```

- [ ] **Step 3: Build and run**

Cmd+R. Search tab → type "khmer" → restaurant results appear after 300ms debounce. Type a username → people results. Recent searches saved. ✓

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Search/SearchView.swift FoodRaccoon/App/MainTabView.swift
git commit -m "feat: SearchView with debounced restaurant + people search, recents"
```

---

### Task 11: Discovery Smoke Test

- [ ] **Step 1: Run all tests**

Cmd+U. Expected: ThemeTests (5), ModelsTests (3), AuthStoreTests (2), RestaurantStoreTests (6), UIImageCircleTests (2). All green.

- [ ] **Step 2: Full flow on simulator**

1. Sign in → Map tab → markers load on Phnom Penh map
2. Tap red marker → RestaurantPanel slides up as bottom sheet
3. Status buttons → tap "Visited" → button fills orange → rating slider appears
4. Swipe panel up → expands to large detent; tap "More" → RestaurantDetailView
5. Filter button → FilterSheet → select a cuisine → markers reduce
6. Map style picker → switch to Satellite → map style changes
7. Search tab → type restaurant name → results appear → tap → RestaurantDetailView

- [ ] **Step 3: Tag discovery complete**

```bash
git tag discovery-complete
git commit --allow-empty -m "chore: Plan 2 Discovery complete"
```

**→ Proceed to Plan 3: Social**
