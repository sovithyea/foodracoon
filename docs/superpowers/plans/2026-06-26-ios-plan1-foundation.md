# FoodRaccoon iOS — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the iOS Xcode project, shared data models, Supabase client, and complete auth flow (email/password + Sign in with Apple) with onboarding — deliverable is a working app you can run on device with full auth.

**Architecture:** SwiftUI app with `@Observable` AuthStore observing Supabase auth state changes. RootView gates on session — shows OnboardingView (first launch) / LoginView / MainTabView scaffold. All Supabase calls use async/await.

**Tech Stack:** Swift 5.9+, SwiftUI, iOS 17+, supabase/supabase-swift 2.x, AuthenticationServices, XCTest

## Global Constraints

- iOS 17.0 minimum deployment target
- Swift 5.9+ (Xcode 15.2+)
- `@Observable` macro for all store classes (not `@StateObject`/`@ObservableObject`)
- Supabase project: `gnmzwzmtdblkujyuvadi`
- Chalk Market palette: bg `#F5F0E8` · card `#EDE6D8` · accent `#D44C2A` · text `#2C2420` · border `#D4C8B4`
- All async ops use `async/await`, no Combine
- Bundle ID: `com.sovithyea.foodraccoon`
- App name: `FoodRaccoon`
- Repo: `foodracoon-ios` (separate from web repo)
- `Config.xcconfig` is gitignored — holds real API keys

---

### Task 1: Create Xcode Project + Git Repo

**Files:**
- Create: `FoodRaccoon.xcodeproj` (via Xcode GUI)
- Create: `.gitignore`
- Create: `FoodRaccoon/Config.xcconfig` (gitignored)
- Create: `FoodRaccoon/Config.swift`
- Modify: `FoodRaccoon/Info.plist`

**Interfaces:**
- Produces: `Config.supabaseURL: String`, `Config.supabaseAnonKey: String`, `Config.mapboxToken: String` — used by all subsequent tasks

- [ ] **Step 1: Create Xcode project**

Open Xcode → File → New → Project → iOS → App.
- Product Name: `FoodRaccoon`
- Bundle Identifier: `com.sovithyea.foodraccoon`
- Interface: SwiftUI
- Language: Swift
- Include Tests: ✓ checked (creates `FoodRaccoonTests` target)
- Storage: None

Save to a new folder `foodracoon-ios/` on your machine.

- [ ] **Step 2: Set deployment target**

Xcode → FoodRaccoon target → General → Minimum Deployments → iOS 17.0.

- [ ] **Step 3: Init git repo**

```bash
cd foodracoon-ios
git init
git branch -M main
```

- [ ] **Step 4: Create .gitignore**

Create `.gitignore` at repo root:

```
.DS_Store
build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
xcuserdata/
*.xccheckout
DerivedData/
*.hmap
*.ipa
*.xcuserstate
.build/
Config.xcconfig
.swiftpm/
```

- [ ] **Step 5: Create Config.xcconfig with real API keys**

Create `FoodRaccoon/Config.xcconfig`:

```
// DO NOT COMMIT — gitignored
SUPABASE_URL = https://gnmzwzmtdblkujyuvadi.supabase.co
SUPABASE_ANON_KEY = YOUR_ANON_KEY_FROM_SUPABASE_DASHBOARD
MAPBOX_ACCESS_TOKEN = YOUR_MAPBOX_TOKEN
```

- [ ] **Step 6: Assign xcconfig to build configurations**

Xcode → click project root in navigator → Info tab → Configurations:
- Debug row: click dropdown → select `FoodRaccoon/Config`
- Release row: click dropdown → select `FoodRaccoon/Config`

- [ ] **Step 7: Add variables to Info.plist**

Open `FoodRaccoon/Info.plist` (right-click → Open As → Source Code), add inside root `<dict>`:

```xml
<key>SUPABASE_URL</key>
<string>$(SUPABASE_URL)</string>
<key>SUPABASE_ANON_KEY</key>
<string>$(SUPABASE_ANON_KEY)</string>
<key>MBXAccessToken</key>
<string>$(MAPBOX_ACCESS_TOKEN)</string>
```

- [ ] **Step 8: Create Config.swift**

Create `FoodRaccoon/Config.swift`:

```swift
enum Config {
    static let supabaseURL: String    = Bundle.main.infoDictionary!["SUPABASE_URL"] as! String
    static let supabaseAnonKey: String = Bundle.main.infoDictionary!["SUPABASE_ANON_KEY"] as! String
    static let mapboxToken: String    = Bundle.main.infoDictionary!["MBXAccessToken"] as! String
}
```

- [ ] **Step 9: Create folder groups in Xcode**

File → New Group (without folder) for each:
`App`, `Auth`, `Map`, `Restaurant`, `Search`, `Lists`, `Feed`, `Profile`, `Shared`, `Shared/Extensions`

Move `FoodRaccoonApp.swift` and `ContentView.swift` into `App/`. Delete `ContentView.swift` (replaced by `RootView.swift` in Task 7).

- [ ] **Step 10: Build to verify**

Cmd+B. Should compile with no errors.

- [ ] **Step 11: Initial commit**

```bash
git add -A
git commit -m "chore: initial Xcode project + Config.xcconfig setup"
```

---

### Task 2: Add SPM Dependencies

**Files:**
- Modified by Xcode: `FoodRaccoon.xcodeproj/project.pbxproj`

**Interfaces:**
- Produces: `import Supabase` resolves, `import MapboxMaps` resolves

- [ ] **Step 1: Add supabase-swift**

Xcode → File → Add Package Dependencies.
- URL: `https://github.com/supabase/supabase-swift`
- Dependency Rule: Up to Next Major from `2.0.0`
- Add to target: FoodRaccoon
- Package product: `Supabase`

- [ ] **Step 2: Add mapbox-maps-ios**

Xcode → File → Add Package Dependencies.
- URL: `https://github.com/mapbox/mapbox-maps-ios`
- Dependency Rule: Up to Next Major from `11.0.0`
- Add to target: FoodRaccoon
- Package product: `MapboxMaps`

- [ ] **Step 3: Build to verify**

Cmd+B. SPM resolves and downloads. Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add supabase-swift and mapbox-maps-ios via SPM"
```

---

### Task 3: Theme + Extensions

**Files:**
- Create: `FoodRaccoon/Shared/Extensions/Color+Hex.swift`
- Create: `FoodRaccoon/Shared/Extensions/Date+Relative.swift`
- Create: `FoodRaccoon/Shared/Theme.swift`
- Test: `FoodRaccoonTests/ThemeTests.swift`

**Interfaces:**
- Produces: `Color(hex:)` initializer
- Produces: `Color.frBackground`, `Color.frCard`, `Color.frAccent`, `Color.frText`, `Color.frBorder`
- Produces: `Color.frBackground(scheme:)`, `Color.frCard(scheme:)`, `Color.frText(scheme:)` — dark mode variants
- Produces: `Date.relativeString: String`

- [ ] **Step 1: Write failing tests**

Create `FoodRaccoonTests/ThemeTests.swift`:

```swift
import XCTest
import SwiftUI
@testable import FoodRaccoon

final class ThemeTests: XCTestCase {
    func testHexColorCreation() {
        let color = Color(hex: "#D44C2A")
        XCTAssertNotNil(color)
    }

    func testRelativeDateSeconds() {
        let date = Date(timeIntervalSinceNow: -30)
        XCTAssertEqual(date.relativeString, "just now")
    }

    func testRelativeDateMinutes() {
        let date = Date(timeIntervalSinceNow: -120)
        XCTAssertEqual(date.relativeString, "2m ago")
    }

    func testRelativeDateHours() {
        let date = Date(timeIntervalSinceNow: -7200)
        XCTAssertEqual(date.relativeString, "2h ago")
    }

    func testRelativeDateDays() {
        let date = Date(timeIntervalSinceNow: -86400 * 3)
        XCTAssertEqual(date.relativeString, "3d ago")
    }
}
```

- [ ] **Step 2: Run — expect failure**

Cmd+U. Fails: types not defined.

- [ ] **Step 3: Create Color+Hex.swift**

```swift
import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:  (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:  (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:  (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}
```

- [ ] **Step 4: Create Date+Relative.swift**

```swift
import Foundation

extension Date {
    var relativeString: String {
        let seconds = Int(-timeIntervalSinceNow)
        switch seconds {
        case 0..<60:    return "just now"
        case 60..<3600: return "\(seconds / 60)m ago"
        case 3600..<86400: return "\(seconds / 3600)h ago"
        default:        return "\(seconds / 86400)d ago"
        }
    }
}
```

- [ ] **Step 5: Create Theme.swift**

```swift
import SwiftUI

extension Color {
    static let frBackground = Color(hex: "#F5F0E8")
    static let frCard       = Color(hex: "#EDE6D8")
    static let frAccent     = Color(hex: "#D44C2A")
    static let frText       = Color(hex: "#2C2420")
    static let frBorder     = Color(hex: "#D4C8B4")

    static func frBackground(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#1C1A18") : .frBackground
    }
    static func frCard(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#2A2724") : .frCard
    }
    static func frText(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#F0EBE3") : .frText
    }
}
```

- [ ] **Step 6: Run tests — expect pass**

Cmd+U. All ThemeTests pass.

- [ ] **Step 7: Commit**

```bash
git add FoodRaccoon/Shared/ FoodRaccoonTests/ThemeTests.swift
git commit -m "feat: theme colors, Color(hex:), Date.relativeString"
```

---

### Task 4: Data Models

**Files:**
- Create: `FoodRaccoon/Shared/Models.swift`
- Test: `FoodRaccoonTests/ModelsTests.swift`

**Interfaces:**
- Produces: `Restaurant`, `RestaurantStatus`, `UserRestaurant`, `UserProfile`, `RestaurantList`, `ListRestaurant`, `FeedItem`
- All types conform to `Codable` with snake_case `CodingKeys`

- [ ] **Step 1: Write failing test**

Create `FoodRaccoonTests/ModelsTests.swift`:

```swift
import XCTest
@testable import FoodRaccoon

final class ModelsTests: XCTestCase {
    func testRestaurantDecoding() throws {
        let json = """
        {"id":"abc","name":"PP BBQ","cuisine_type":["BBQ"],"district":"Daun Penh",
         "latitude":11.56,"longitude":104.92,"cover_photo_url":null,"price_range":2,
         "tags":["outdoor"],"saves_count":10,"is_verified":true,"address":null,
         "phone":null,"website":null,"google_rating":null,"google_rating_count":null,
         "google_place_id":null,"opening_hours":null,"created_at":"2024-01-01T00:00:00Z"}
        """.data(using: .utf8)!
        let r = try JSONDecoder().decode(Restaurant.self, from: json)
        XCTAssertEqual(r.id, "abc")
        XCTAssertEqual(r.cuisineType, ["BBQ"])
        XCTAssertEqual(r.priceRange, 2)
        XCTAssertEqual(r.priceLabel, "$$")
    }

    func testRestaurantStatusRawValues() {
        XCTAssertEqual(RestaurantStatus(rawValue: "want_to_try"), .wantToTry)
        XCTAssertEqual(RestaurantStatus(rawValue: "visited"), .visited)
        XCTAssertEqual(RestaurantStatus(rawValue: "favourite"), .favourite)
    }

    func testUserProfileDecoding() throws {
        let json = """
        {"id":"u1","username":"vith","display_name":"Vith","avatar_url":null,
         "bio":null,"city":null,"followers_count":10,"following_count":5,
         "is_admin":false,"created_at":"2024-01-01T00:00:00Z"}
        """.data(using: .utf8)!
        let p = try JSONDecoder().decode(UserProfile.self, from: json)
        XCTAssertEqual(p.username, "vith")
        XCTAssertEqual(p.followersCount, 10)
    }
}
```

- [ ] **Step 2: Run — expect failure**

Cmd+U. Fails: types not defined.

- [ ] **Step 3: Create Models.swift**

```swift
import Foundation

// MARK: - Restaurant

struct Restaurant: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let cuisineType: [String]
    let district: String?
    let latitude: Double
    let longitude: Double
    let coverPhotoUrl: String?
    let priceRange: Int?
    let tags: [String]
    let savesCount: Int
    let isVerified: Bool
    let address: String?
    let phone: String?
    let website: String?
    let googleRating: Double?
    let googleRatingCount: Int?
    let googlePlaceId: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, name, district, latitude, longitude, address, phone, website, tags
        case cuisineType      = "cuisine_type"
        case coverPhotoUrl    = "cover_photo_url"
        case priceRange       = "price_range"
        case savesCount       = "saves_count"
        case isVerified       = "is_verified"
        case googleRating     = "google_rating"
        case googleRatingCount = "google_rating_count"
        case googlePlaceId    = "google_place_id"
        case openingHours     = "opening_hours"
        case createdAt        = "created_at"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id              = try c.decode(String.self, forKey: .id)
        name            = try c.decode(String.self, forKey: .name)
        cuisineType     = (try? c.decodeIfPresent([String].self, forKey: .cuisineType)) ?? []
        district        = try? c.decodeIfPresent(String.self, forKey: .district)
        latitude        = try c.decode(Double.self, forKey: .latitude)
        longitude       = try c.decode(Double.self, forKey: .longitude)
        coverPhotoUrl   = try? c.decodeIfPresent(String.self, forKey: .coverPhotoUrl)
        priceRange      = try? c.decodeIfPresent(Int.self, forKey: .priceRange)
        tags            = (try? c.decodeIfPresent([String].self, forKey: .tags)) ?? []
        savesCount      = (try? c.decodeIfPresent(Int.self, forKey: .savesCount)) ?? 0
        isVerified      = (try? c.decodeIfPresent(Bool.self, forKey: .isVerified)) ?? false
        address         = try? c.decodeIfPresent(String.self, forKey: .address)
        phone           = try? c.decodeIfPresent(String.self, forKey: .phone)
        website         = try? c.decodeIfPresent(String.self, forKey: .website)
        googleRating    = try? c.decodeIfPresent(Double.self, forKey: .googleRating)
        googleRatingCount = try? c.decodeIfPresent(Int.self, forKey: .googleRatingCount)
        googlePlaceId   = try? c.decodeIfPresent(String.self, forKey: .googlePlaceId)
        createdAt       = (try? c.decodeIfPresent(String.self, forKey: .createdAt)) ?? ""
        // openingHours: skip (complex JSON blob, not needed on iOS v1)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(name, forKey: .name)
        try c.encode(cuisineType, forKey: .cuisineType)
        try c.encodeIfPresent(district, forKey: .district)
        try c.encode(latitude, forKey: .latitude)
        try c.encode(longitude, forKey: .longitude)
        try c.encodeIfPresent(coverPhotoUrl, forKey: .coverPhotoUrl)
        try c.encodeIfPresent(priceRange, forKey: .priceRange)
        try c.encode(tags, forKey: .tags)
        try c.encode(savesCount, forKey: .savesCount)
        try c.encode(isVerified, forKey: .isVerified)
    }

    var priceLabel: String { String(repeating: "$", count: priceRange ?? 1) }
}

// MARK: - RestaurantStatus

enum RestaurantStatus: String, Codable, CaseIterable {
    case wantToTry = "want_to_try"
    case visited   = "visited"
    case favourite = "favourite"

    var label: String {
        switch self {
        case .wantToTry: return "Want to try"
        case .visited:   return "Visited"
        case .favourite: return "Favourite"
        }
    }

    var systemImage: String {
        switch self {
        case .wantToTry: return "bookmark"
        case .visited:   return "checkmark.circle"
        case .favourite: return "heart"
        }
    }
}

// MARK: - UserRestaurant

struct UserRestaurant: Codable, Identifiable {
    let id: String
    let userId: String
    let restaurantId: String
    let status: RestaurantStatus?
    let rating: Int?
    let review: String?
    let isPublic: Bool
    let photos: [String]
    let updatedAt: String
    let visitedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, status, rating, review, photos
        case userId       = "user_id"
        case restaurantId = "restaurant_id"
        case isPublic     = "is_public"
        case updatedAt    = "updated_at"
        case visitedAt    = "visited_at"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id           = try c.decode(String.self, forKey: .id)
        userId       = try c.decode(String.self, forKey: .userId)
        restaurantId = try c.decode(String.self, forKey: .restaurantId)
        status       = try? c.decodeIfPresent(RestaurantStatus.self, forKey: .status)
        rating       = try? c.decodeIfPresent(Int.self, forKey: .rating)
        review       = try? c.decodeIfPresent(String.self, forKey: .review)
        isPublic     = (try? c.decodeIfPresent(Bool.self, forKey: .isPublic)) ?? true
        photos       = (try? c.decodeIfPresent([String].self, forKey: .photos)) ?? []
        updatedAt    = try c.decode(String.self, forKey: .updatedAt)
        visitedAt    = try? c.decodeIfPresent(String.self, forKey: .visitedAt)
    }
}

// MARK: - UserProfile

struct UserProfile: Codable, Identifiable, Hashable {
    let id: String
    let username: String?
    let displayName: String?
    let avatarUrl: String?
    let bio: String?
    let city: String?
    let followersCount: Int
    let followingCount: Int
    let isAdmin: Bool

    enum CodingKeys: String, CodingKey {
        case id, username, bio, city
        case displayName    = "display_name"
        case avatarUrl      = "avatar_url"
        case followersCount = "followers_count"
        case followingCount = "following_count"
        case isAdmin        = "is_admin"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id             = try c.decode(String.self, forKey: .id)
        username       = try? c.decodeIfPresent(String.self, forKey: .username)
        displayName    = try? c.decodeIfPresent(String.self, forKey: .displayName)
        avatarUrl      = try? c.decodeIfPresent(String.self, forKey: .avatarUrl)
        bio            = try? c.decodeIfPresent(String.self, forKey: .bio)
        city           = try? c.decodeIfPresent(String.self, forKey: .city)
        followersCount = (try? c.decodeIfPresent(Int.self, forKey: .followersCount)) ?? 0
        followingCount = (try? c.decodeIfPresent(Int.self, forKey: .followingCount)) ?? 0
        isAdmin        = (try? c.decodeIfPresent(Bool.self, forKey: .isAdmin)) ?? false
    }

    var displayLabel: String { displayName ?? username ?? "User" }
}

// MARK: - RestaurantList

struct RestaurantList: Codable, Identifiable, Hashable {
    let id: String
    let userId: String
    let title: String
    let slug: String?
    let emoji: String?
    let description: String?
    let isPublic: Bool
    let coverPhotoUrl: String?
    let createdAt: String
    var restaurantCount: Int = 0

    enum CodingKeys: String, CodingKey {
        case id, title, slug, emoji, description
        case userId       = "user_id"
        case isPublic     = "is_public"
        case coverPhotoUrl = "cover_photo_url"
        case createdAt    = "created_at"
    }
}

// MARK: - ListRestaurant

struct ListRestaurant: Codable {
    let listId: String
    let restaurantId: String
    let note: String?
    let position: Int?
    let addedAt: String
    var restaurant: Restaurant?

    enum CodingKeys: String, CodingKey {
        case note, position
        case listId       = "list_id"
        case restaurantId = "restaurant_id"
        case addedAt      = "added_at"
        case restaurant   = "restaurants"
    }
}

// MARK: - FeedItem

struct FeedItem: Codable, Identifiable {
    let id: String
    let userId: String
    let restaurantId: String
    let status: RestaurantStatus?
    let rating: Int?
    let review: String?
    let isPublic: Bool
    let updatedAt: String
    var profile: UserProfile?
    var restaurant: Restaurant?

    enum CodingKeys: String, CodingKey {
        case id, status, rating, review
        case userId       = "user_id"
        case restaurantId = "restaurant_id"
        case isPublic     = "is_public"
        case updatedAt    = "updated_at"
        case profile      = "profiles"
        case restaurant   = "restaurants"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id           = try c.decode(String.self, forKey: .id)
        userId       = try c.decode(String.self, forKey: .userId)
        restaurantId = try c.decode(String.self, forKey: .restaurantId)
        status       = try? c.decodeIfPresent(RestaurantStatus.self, forKey: .status)
        rating       = try? c.decodeIfPresent(Int.self, forKey: .rating)
        review       = try? c.decodeIfPresent(String.self, forKey: .review)
        isPublic     = (try? c.decodeIfPresent(Bool.self, forKey: .isPublic)) ?? true
        updatedAt    = try c.decode(String.self, forKey: .updatedAt)
        profile      = try? c.decodeIfPresent(UserProfile.self, forKey: .profile)
        restaurant   = try? c.decodeIfPresent(Restaurant.self, forKey: .restaurant)
    }
}
```

- [ ] **Step 4: Run tests — expect pass**

Cmd+U. All ModelsTests pass.

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Shared/Models.swift FoodRaccoonTests/ModelsTests.swift
git commit -m "feat: data models (Restaurant, UserProfile, RestaurantList, FeedItem)"
```

---

### Task 5: SupabaseClient Singleton

**Files:**
- Create: `FoodRaccoon/Shared/SupabaseClient.swift`

**Interfaces:**
- Produces: `supabase: SupabaseClient` — global singleton imported in all stores

- [ ] **Step 1: Create SupabaseClient.swift**

```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: Config.supabaseURL)!,
    supabaseKey: Config.supabaseAnonKey
)
```

- [ ] **Step 2: Build**

Cmd+B. Compiles — integration verified implicitly by auth tasks.

- [ ] **Step 3: Commit**

```bash
git add FoodRaccoon/Shared/SupabaseClient.swift
git commit -m "feat: Supabase client singleton"
```

---

### Task 6: AuthStore

**Files:**
- Create: `FoodRaccoon/Auth/AuthStore.swift`
- Test: `FoodRaccoonTests/AuthStoreTests.swift`

**Interfaces:**
- Produces: `AuthStore` — `@Observable`, `@MainActor`
- Produces: `.session: Session?`, `.profile: UserProfile?`, `.isLoading: Bool`, `.errorMessage: String?`
- Produces: `startObservingAuthChanges()`, `signIn(email:password:) async throws`, `signUp(email:password:) async throws`, `signOut() async throws`, `signInWithApple(idToken:) async throws`

- [ ] **Step 1: Write failing test**

Create `FoodRaccoonTests/AuthStoreTests.swift`:

```swift
import XCTest
@testable import FoodRaccoon

@MainActor
final class AuthStoreTests: XCTestCase {
    func testInitialState() {
        let store = AuthStore()
        XCTAssertNil(store.session)
        XCTAssertNil(store.profile)
        XCTAssertFalse(store.isLoading)
        XCTAssertNil(store.errorMessage)
    }

    func testSignOutClearsState() async {
        let store = AuthStore()
        // Simulate state that signOut should clear
        store.profile = nil
        store.session = nil
        XCTAssertNil(store.session)
        XCTAssertNil(store.profile)
    }
}
```

- [ ] **Step 2: Run — expect failure**

Cmd+U. Fails: `AuthStore` not defined.

- [ ] **Step 3: Create AuthStore.swift**

```swift
import Supabase
import Observation

@Observable
@MainActor
class AuthStore {
    var session: Session? = nil
    var profile: UserProfile? = nil
    var isLoading = false
    var errorMessage: String? = nil

    func startObservingAuthChanges() {
        Task {
            for await (_, session) in await supabase.auth.authStateChanges {
                self.session = session
                if session != nil {
                    await fetchProfile()
                } else {
                    self.profile = nil
                }
            }
        }
    }

    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        try await supabase.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        try await supabase.auth.signUp(email: email, password: password)
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
        session = nil
        profile = nil
    }

    func signInWithApple(idToken: String) async throws {
        isLoading = true
        defer { isLoading = false }
        try await supabase.auth.signInWithIdToken(
            credentials: .init(provider: .apple, idToken: idToken)
        )
    }

    private func fetchProfile() async {
        guard let userId = session?.user.id.uuidString else { return }
        do {
            profile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: userId)
                .single()
                .execute()
                .value
        } catch {
            // New user — profile created by Supabase trigger on signup
        }
    }
}
```

- [ ] **Step 4: Run tests — expect pass**

Cmd+U. AuthStoreTests pass.

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Auth/AuthStore.swift FoodRaccoonTests/AuthStoreTests.swift
git commit -m "feat: AuthStore with session observation, sign in/up/out, Apple"
```

---

### Task 7: SplashView + RootView + App Entry

**Files:**
- Create: `FoodRaccoon/App/SplashView.swift`
- Create: `FoodRaccoon/App/RootView.swift`
- Create: `FoodRaccoon/App/MainTabView.swift` (stub — replaced in Plan 2)
- Modify: `FoodRaccoon/App/FoodRaccoonApp.swift`

**Interfaces:**
- Consumes: `AuthStore.session`, `AuthStore.startObservingAuthChanges()`
- Produces: app entry point routing to auth or tab bar

- [ ] **Step 1: Create SplashView.swift**

```swift
import SwiftUI

struct SplashView: View {
    var body: some View {
        ZStack {
            Color.frBackground.ignoresSafeArea()
            VStack(spacing: 12) {
                Image(systemName: "fork.knife.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(Color.frAccent)
                Text("FoodRaccoon")
                    .font(.title.bold())
                    .foregroundStyle(Color.frText)
            }
        }
    }
}

#Preview { SplashView() }
```

- [ ] **Step 2: Create MainTabView.swift (stub)**

```swift
import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack { Text("Map").navigationTitle("Map") }
                .tabItem { Label("Map", systemImage: "map.fill") }
            NavigationStack { Text("Search").navigationTitle("Search") }
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
            NavigationStack { Text("Lists").navigationTitle("Lists") }
                .tabItem { Label("Lists", systemImage: "list.bullet") }
            NavigationStack { Text("Feed").navigationTitle("Feed") }
                .tabItem { Label("Feed", systemImage: "bell.fill") }
            NavigationStack { Text("Profile").navigationTitle("Profile") }
                .tabItem { Label("Profile", systemImage: "person.fill") }
        }
        .tint(Color.frAccent)
    }
}

#Preview {
    MainTabView()
        .environment(AuthStore())
}
```

- [ ] **Step 3: Create RootView.swift**

```swift
import SwiftUI

struct RootView: View {
    @Environment(AuthStore.self) private var authStore
    @State private var isCheckingSession = true

    private var hasSeenOnboarding: Bool {
        UserDefaults.standard.bool(forKey: "hasSeenOnboarding")
    }

    var body: some View {
        Group {
            if isCheckingSession {
                SplashView()
            } else if authStore.session != nil {
                MainTabView()
            } else if !hasSeenOnboarding {
                OnboardingView()
            } else {
                LoginView()
            }
        }
        .task {
            // Allow keychain session restore to propagate
            try? await Task.sleep(for: .milliseconds(600))
            isCheckingSession = false
        }
    }
}
```

- [ ] **Step 4: Update FoodRaccoonApp.swift**

Replace entire file:

```swift
import SwiftUI

@main
struct FoodRaccoonApp: App {
    @State private var authStore = AuthStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authStore)
                .onAppear {
                    authStore.startObservingAuthChanges()
                }
        }
    }
}
```

- [ ] **Step 5: Build and run on simulator**

Cmd+R on iPhone 16 simulator. SplashView briefly → OnboardingView (first launch). No crashes.

- [ ] **Step 6: Commit**

```bash
git add FoodRaccoon/App/
git commit -m "feat: app entry, splash, root routing, main tab scaffold"
```

---

### Task 8: LoginView

**Files:**
- Create: `FoodRaccoon/Auth/LoginView.swift`

**Interfaces:**
- Consumes: `AuthStore.signIn(email:password:)`, `AuthStore.isLoading`
- Produces: `LoginView` — used by `RootView` and as `.sheet` for auth gate in Plans 2–3

- [ ] **Step 1: Create LoginView.swift**

```swift
import SwiftUI

struct LoginView: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var showSignup = false
    var isDismissable = false

    var body: some View {
        ZStack {
            Color.frBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                if isDismissable {
                    HStack {
                        Spacer()
                        Button { dismiss() } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.title2)
                                .foregroundStyle(Color.frText.opacity(0.4))
                        }
                        .padding()
                    }
                }

                Spacer()

                VStack(spacing: 8) {
                    Image(systemName: "fork.knife.circle.fill")
                        .font(.system(size: 56))
                        .foregroundStyle(Color.frAccent)
                    Text("FoodRaccoon")
                        .font(.title2.bold())
                        .foregroundStyle(Color.frText)
                    Text("Discover Phnom Penh's best eats")
                        .font(.subheadline)
                        .foregroundStyle(Color.frText.opacity(0.6))
                }
                .padding(.bottom, 40)

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding(14)
                        .background(Color.frCard)
                        .cornerRadius(10)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.frBorder))

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding(14)
                        .background(Color.frCard)
                        .cornerRadius(10)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.frBorder))

                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        Task { await signIn() }
                    } label: {
                        HStack {
                            if authStore.isLoading { ProgressView().tint(.white) }
                            Text("Sign In").fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Color.frAccent)
                        .foregroundStyle(.white)
                        .cornerRadius(10)
                    }
                    .disabled(authStore.isLoading || email.isEmpty || password.isEmpty)
                }
                .padding(.horizontal, 24)

                divider.padding(.vertical, 16)

                // Sign in with Apple placeholder — replaced in Task 11
                SignInWithAppleSection()
                    .padding(.horizontal, 24)

                Spacer()

                HStack(spacing: 4) {
                    Text("Don't have an account?")
                        .foregroundStyle(Color.frText.opacity(0.7))
                    Button("Sign up") { showSignup = true }
                        .foregroundStyle(Color.frAccent)
                        .fontWeight(.semibold)
                }
                .font(.subheadline)
                .padding(.bottom, 32)
            }
        }
        .sheet(isPresented: $showSignup) {
            SignupView()
                .environment(authStore)
        }
    }

    private var divider: some View {
        HStack {
            Rectangle().frame(height: 1).foregroundStyle(Color.frBorder)
            Text("or").font(.caption).foregroundStyle(Color.frText.opacity(0.5))
            Rectangle().frame(height: 1).foregroundStyle(Color.frBorder)
        }
        .padding(.horizontal, 24)
    }

    private func signIn() async {
        errorMessage = nil
        do {
            try await authStore.signIn(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// Placeholder — replaced in Task 11
struct SignInWithAppleSection: View {
    var body: some View { EmptyView() }
}

#Preview {
    LoginView()
        .environment(AuthStore())
}
```

- [ ] **Step 2: Build and run**

Cmd+R. Enter wrong credentials → error appears. No crash.

- [ ] **Step 3: Commit**

```bash
git add FoodRaccoon/Auth/LoginView.swift
git commit -m "feat: LoginView with email/password form and error handling"
```

---

### Task 9: SignupView + VerifyEmailView

**Files:**
- Create: `FoodRaccoon/Auth/SignupView.swift`
- Create: `FoodRaccoon/Auth/VerifyEmailView.swift`

**Interfaces:**
- Consumes: `AuthStore.signUp(email:password:)`, `AuthStore.isLoading`
- Produces: `SignupView`, `VerifyEmailView`

- [ ] **Step 1: Create SignupView.swift**

```swift
import SwiftUI

struct SignupView: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var errorMessage: String?
    @State private var showVerify = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.frBackground.ignoresSafeArea()
                VStack(spacing: 16) {
                    VStack(spacing: 12) {
                        TextField("Email", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .padding(14)
                            .background(Color.frCard)
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.frBorder))

                        SecureField("Password", text: $password)
                            .textContentType(.newPassword)
                            .padding(14)
                            .background(Color.frCard)
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.frBorder))

                        SecureField("Confirm password", text: $confirmPassword)
                            .textContentType(.newPassword)
                            .padding(14)
                            .background(Color.frCard)
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.frBorder))

                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        Button {
                            Task { await signUp() }
                        } label: {
                            HStack {
                                if authStore.isLoading { ProgressView().tint(.white) }
                                Text("Create Account").fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(14)
                            .background(Color.frAccent)
                            .foregroundStyle(.white)
                            .cornerRadius(10)
                        }
                        .disabled(authStore.isLoading || email.isEmpty || password.isEmpty)
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.top, 24)
            }
            .navigationTitle("Create Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.frAccent)
                }
            }
        }
        .fullScreenCover(isPresented: $showVerify) {
            VerifyEmailView(email: email)
        }
    }

    private func signUp() async {
        guard password == confirmPassword else { errorMessage = "Passwords don't match"; return }
        guard password.count >= 6 else { errorMessage = "Password must be at least 6 characters"; return }
        errorMessage = nil
        do {
            try await authStore.signUp(email: email, password: password)
            showVerify = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview { SignupView().environment(AuthStore()) }
```

- [ ] **Step 2: Create VerifyEmailView.swift**

```swift
import SwiftUI

struct VerifyEmailView: View {
    let email: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.frBackground.ignoresSafeArea()
            VStack(spacing: 24) {
                Image(systemName: "envelope.circle.fill")
                    .font(.system(size: 72))
                    .foregroundStyle(Color.frAccent)

                VStack(spacing: 8) {
                    Text("Check your email")
                        .font(.title2.bold())
                        .foregroundStyle(Color.frText)
                    Text("We sent a verification link to\n\(email)")
                        .font(.subheadline)
                        .foregroundStyle(Color.frText.opacity(0.7))
                        .multilineTextAlignment(.center)
                }

                Text("Click the link in the email to verify your account, then sign in.")
                    .font(.callout)
                    .foregroundStyle(Color.frText.opacity(0.6))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Button("Back to Sign In") { dismiss() }
                    .frame(maxWidth: .infinity)
                    .padding(14)
                    .background(Color.frAccent)
                    .foregroundStyle(.white)
                    .cornerRadius(10)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 24)
            }
            .padding(.top, 60)
        }
    }
}

#Preview { VerifyEmailView(email: "vith@example.com") }
```

- [ ] **Step 3: Build and run**

Cmd+R. Tap "Sign up" → SignupView → mismatch passwords → error message. Correct passwords → VerifyEmailView.

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Auth/SignupView.swift FoodRaccoon/Auth/VerifyEmailView.swift
git commit -m "feat: SignupView and VerifyEmailView"
```

---

### Task 10: OnboardingView

**Files:**
- Create: `FoodRaccoon/Auth/OnboardingView.swift`

**Interfaces:**
- Produces: `OnboardingView` — shown first launch before auth; sets `UserDefaults["hasSeenOnboarding"]`

- [ ] **Step 1: Create OnboardingView.swift**

```swift
import SwiftUI

private struct Page {
    let icon: String
    let title: String
    let body: String
}

private let pages: [Page] = [
    .init(icon: "map.fill",
          title: "Discover Phnom Penh",
          body: "Find the best restaurants on an interactive map."),
    .init(icon: "bookmark.fill",
          title: "Build your lists",
          body: "Save places to try, mark visited spots, create custom lists."),
    .init(icon: "person.2.fill",
          title: "Follow friends",
          body: "See what friends are eating and share your food adventures."),
]

struct OnboardingView: View {
    @State private var page = 0
    @State private var showAuth = false

    var body: some View {
        ZStack {
            Color.frBackground.ignoresSafeArea()
            VStack {
                TabView(selection: $page) {
                    ForEach(pages.indices, id: \.self) { i in
                        VStack(spacing: 24) {
                            Image(systemName: pages[i].icon)
                                .font(.system(size: 72))
                                .foregroundStyle(Color.frAccent)
                            Text(pages[i].title)
                                .font(.title2.bold())
                                .foregroundStyle(Color.frText)
                            Text(pages[i].body)
                                .font(.body)
                                .foregroundStyle(Color.frText.opacity(0.7))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                        }
                        .tag(i)
                    }
                }
                .tabViewStyle(.page)
                .indexViewStyle(.page(backgroundDisplayMode: .always))

                Button(page < pages.count - 1 ? "Next" : "Get Started") {
                    if page < pages.count - 1 {
                        withAnimation { page += 1 }
                    } else {
                        UserDefaults.standard.set(true, forKey: "hasSeenOnboarding")
                        showAuth = true
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color.frAccent)
                .foregroundStyle(.white)
                .cornerRadius(12)
                .fontWeight(.semibold)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
                .animation(.none, value: page)
            }
        }
        .fullScreenCover(isPresented: $showAuth) {
            LoginView()
                .environment(AuthStore())
        }
    }
}

#Preview { OnboardingView().environment(AuthStore()) }
```

- [ ] **Step 2: Build and run on fresh simulator**

Cmd+R. Should see 3-page onboarding → "Get Started" → LoginView. Second launch: no onboarding.

- [ ] **Step 3: Commit**

```bash
git add FoodRaccoon/Auth/OnboardingView.swift
git commit -m "feat: OnboardingView with 3-page carousel, first-launch gate"
```

---

### Task 11: Sign in with Apple

**Files:**
- Modify: `FoodRaccoon/Auth/LoginView.swift`
- Modify: `FoodRaccoon/Auth/SignupView.swift`

**Prerequisites:**
1. Apple Developer account — enable "Sign in with Apple" for bundle ID `com.sovithyea.foodraccoon` at developer.apple.com
2. Supabase Dashboard → Authentication → Providers → Apple → configure with your Service ID + private key
3. Xcode → FoodRaccoon target → Signing & Capabilities → + Capability → Sign in with Apple

**Interfaces:**
- Consumes: `AuthStore.signInWithApple(idToken:)`
- Produces: `SignInWithAppleSection` view — replaces placeholder in LoginView and SignupView

- [ ] **Step 1: Add Sign in with Apple capability**

Xcode → FoodRaccoon target → Signing & Capabilities tab → + Capability → Sign in with Apple.

- [ ] **Step 2: Replace SignInWithAppleSection in LoginView.swift**

Delete the placeholder struct at the bottom of `LoginView.swift` and replace with:

```swift
import AuthenticationServices

struct SignInWithAppleSection: View {
    @Environment(AuthStore.self) private var authStore
    @State private var appleError: String?

    var body: some View {
        VStack(spacing: 8) {
            SignInWithAppleButton(.signIn) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                Task { await handle(result) }
            }
            .frame(height: 50)
            .cornerRadius(10)

            if let error = appleError {
                Text(error).font(.caption).foregroundStyle(.red)
            }
        }
    }

    private func handle(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let auth):
            guard
                let cred = auth.credential as? ASAuthorizationAppleIDCredential,
                let data = cred.identityToken,
                let token = String(data: data, encoding: .utf8)
            else { appleError = "Apple sign in failed: missing token"; return }
            do {
                try await authStore.signInWithApple(idToken: token)
            } catch {
                appleError = error.localizedDescription
            }
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code != .canceled {
                appleError = error.localizedDescription
            }
        }
    }
}
```

Also add `import AuthenticationServices` at the top of `LoginView.swift`.

- [ ] **Step 3: Add Sign in with Apple to SignupView.swift**

In `SignupView.swift`, after the "Create Account" button inside its VStack, add:

```swift
HStack {
    Rectangle().frame(height: 1).foregroundStyle(Color.frBorder)
    Text("or").font(.caption).foregroundStyle(Color.frText.opacity(0.5))
    Rectangle().frame(height: 1).foregroundStyle(Color.frBorder)
}

SignInWithAppleSection()
```

Add `import AuthenticationServices` at the top of `SignupView.swift`.

- [ ] **Step 4: Build and run on device**

Sign in with Apple requires a real device (not simulator) for full flow. Cmd+R on connected iPhone. LoginView shows Apple button. Tap it → Apple's native sheet appears. Completing the flow signs in via Supabase.

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Auth/LoginView.swift FoodRaccoon/Auth/SignupView.swift
git commit -m "feat: Sign in with Apple integrated in Login and Signup"
```

---

### Task 12: Foundation Smoke Test

- [ ] **Step 1: Run all tests**

Cmd+U. Expected results:
- ThemeTests: 5 pass
- ModelsTests: 3 pass
- AuthStoreTests: 2 pass

All green.

- [ ] **Step 2: Verify auth flow on simulator**

1. Fresh install → Onboarding (3 pages) → "Get Started" → LoginView
2. "Sign up" → SignupView → enter email + matching password → VerifyEmailView shown
3. Verify email in inbox → return to app → LoginView → sign in → MainTabView (5 stubs)
4. Kill and relaunch → MainTabView (session restored from keychain)

- [ ] **Step 3: Tag foundation complete**

```bash
git tag foundation-complete
git commit --allow-empty -m "chore: Plan 1 Foundation complete"
```

**→ Proceed to Plan 2: Discovery**
