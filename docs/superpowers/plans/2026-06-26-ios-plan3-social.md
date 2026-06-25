# FoodRaccoon iOS — Plan 3: Social

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plans 1 and 2 complete and running.

**Goal:** Implement all social and organizational features — custom lists, activity feed, own profile, public profiles, follow/unfollow, and edit profile. Delivers full feature parity with the web app.

**Architecture:** `ListsStore` (`@Observable`) drives all list operations. `FeedView` uses cursor pagination via `updated_at`. `PublicProfileView` replaces the stub from Plan 2. All auth-gated actions use `AuthGateButton` from Plan 2.

**Tech Stack:** SwiftUI, supabase-swift, Observation, XCTest

## Global Constraints

- iOS 17.0+, Swift 5.9+, `@Observable` stores
- All Supabase calls use async/await
- `supabase` singleton from `SupabaseClient.swift`
- Models: `Restaurant`, `RestaurantStatus`, `UserProfile`, `RestaurantList`, `ListRestaurant`, `FeedItem`
- Theme: `Color.frAccent`, `Color.frBackground`, `Color.frCard`, `Color.frText`, `Color.frBorder`
- `AuthGateButton` from Plan 2: `FoodRaccoon/Shared/AuthGateButton.swift`
- `StatusBadge` from Plan 2: `FoodRaccoon/Map/RestaurantPanel.swift`
- `RestaurantDetailView` from Plan 2: `FoodRaccoon/Restaurant/RestaurantDetailView.swift`

---

### Task 1: ListsStore

**Files:**
- Create: `FoodRaccoon/Shared/ListsStore.swift`
- Test: `FoodRaccoonTests/ListsStoreTests.swift`

**Interfaces:**
- Produces: `ListsStore` — `@Observable`, `@MainActor`
- Produces: `.lists: [RestaurantList]`, `.isLoading: Bool`
- Produces: `fetchLists(userId:) async`
- Produces: `createList(title:emoji:isPublic:userId:) async throws -> RestaurantList`
- Produces: `updateList(_ list: RestaurantList, title: String, emoji: String?, isPublic: Bool) async throws`
- Produces: `deleteList(id:) async throws`
- Produces: `addRestaurant(listId:restaurantId:) async throws`
- Produces: `removeRestaurant(listId:restaurantId:) async throws`
- Produces: `fetchListRestaurants(listId:) async throws -> [ListRestaurant]`

- [ ] **Step 1: Write failing tests**

Create `FoodRaccoonTests/ListsStoreTests.swift`:

```swift
import XCTest
@testable import FoodRaccoon

@MainActor
final class ListsStoreTests: XCTestCase {
    func testInitialState() {
        let store = ListsStore()
        XCTAssertTrue(store.lists.isEmpty)
        XCTAssertFalse(store.isLoading)
    }

    func testListsSortedByCreatedAt() {
        let store = ListsStore()
        store.lists = [
            makeList(id: "1", createdAt: "2024-01-02T00:00:00Z"),
            makeList(id: "2", createdAt: "2024-01-01T00:00:00Z"),
        ]
        XCTAssertEqual(store.lists[0].id, "1")
    }

    // MARK: - Helpers

    private func makeList(id: String, createdAt: String) -> RestaurantList {
        let json = """
        {"id":"\(id)","user_id":"u1","title":"My List","slug":null,"emoji":"🍜",
         "description":null,"is_public":true,"cover_photo_url":null,"created_at":"\(createdAt)"}
        """.data(using: .utf8)!
        return try! JSONDecoder().decode(RestaurantList.self, from: json)
    }
}
```

- [ ] **Step 2: Run — expect failure**

Cmd+U. Fails: `ListsStore` not defined.

- [ ] **Step 3: Create ListsStore.swift**

```swift
import Supabase
import Observation

@Observable
@MainActor
class ListsStore {
    var lists: [RestaurantList] = []
    var isLoading = false

    func fetchLists(userId: String) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let fetched: [RestaurantList] = try await supabase
                .from("lists")
                .select()
                .eq("user_id", value: userId)
                .order("created_at", ascending: false)
                .execute()
                .value
            lists = fetched
        } catch {
            print("[ListsStore] fetchLists error: \(error)")
        }
    }

    func createList(title: String, emoji: String?, isPublic: Bool, userId: String) async throws -> RestaurantList {
        let slug = title.lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .filter { $0.isLetter || $0.isNumber || $0 == "-" }

        var body: [String: AnyEncodable] = [
            "title": AnyEncodable(title),
            "user_id": AnyEncodable(userId),
            "slug": AnyEncodable(slug),
            "is_public": AnyEncodable(isPublic),
        ]
        if let emoji { body["emoji"] = AnyEncodable(emoji) }

        let created: RestaurantList = try await supabase
            .from("lists")
            .insert(body)
            .select()
            .single()
            .execute()
            .value

        lists.insert(created, at: 0)
        return created
    }

    func updateList(_ list: RestaurantList, title: String, emoji: String?, isPublic: Bool) async throws {
        let slug = title.lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .filter { $0.isLetter || $0.isNumber || $0 == "-" }

        var body: [String: AnyEncodable] = [
            "title": AnyEncodable(title),
            "slug": AnyEncodable(slug),
            "is_public": AnyEncodable(isPublic),
        ]
        body["emoji"] = AnyEncodable(emoji as Any)

        try await supabase
            .from("lists")
            .update(body)
            .eq("id", value: list.id)
            .execute()

        if let idx = lists.firstIndex(where: { $0.id == list.id }) {
            var updated = list
            // Decode updated list from Supabase response
            let fresh: RestaurantList = try await supabase
                .from("lists")
                .select()
                .eq("id", value: list.id)
                .single()
                .execute()
                .value
            lists[idx] = fresh
        }
    }

    func deleteList(id: String) async throws {
        try await supabase
            .from("lists")
            .delete()
            .eq("id", value: id)
            .execute()
        lists.removeAll { $0.id == id }
    }

    func addRestaurant(listId: String, restaurantId: String) async throws {
        try await supabase
            .from("list_restaurants")
            .insert(["list_id": listId, "restaurant_id": restaurantId])
            .execute()
    }

    func removeRestaurant(listId: String, restaurantId: String) async throws {
        try await supabase
            .from("list_restaurants")
            .delete()
            .eq("list_id", value: listId)
            .eq("restaurant_id", value: restaurantId)
            .execute()
    }

    func fetchListRestaurants(listId: String) async throws -> [ListRestaurant] {
        let rows: [ListRestaurant] = try await supabase
            .from("list_restaurants")
            .select("*, restaurants(*)")
            .eq("list_id", value: listId)
            .order("added_at", ascending: false)
            .execute()
            .value
        return rows
    }
}

// Helper for heterogeneous Supabase insert bodies
struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void
    init<T: Encodable>(_ value: T) { _encode = { try value.encode(to: $0) } }
    func encode(to encoder: Encoder) throws { try _encode(encoder) }
}
```

- [ ] **Step 4: Run tests — expect pass**

Cmd+U. ListsStoreTests pass.

- [ ] **Step 5: Inject ListsStore into app**

In `FoodRaccoonApp.swift`, add `@State private var listsStore = ListsStore()` and `.environment(listsStore)`.

- [ ] **Step 6: Commit**

```bash
git add FoodRaccoon/Shared/ListsStore.swift \
        FoodRaccoon/App/FoodRaccoonApp.swift \
        FoodRaccoonTests/ListsStoreTests.swift
git commit -m "feat: ListsStore with CRUD and list_restaurants operations"
```

---

### Task 2: CreateListSheet + AddToListSheet

**Files:**
- Create: `FoodRaccoon/Lists/CreateListSheet.swift`
- Create: `FoodRaccoon/Lists/AddToListSheet.swift`

**Interfaces:**
- Consumes: `ListsStore.createList(title:emoji:isPublic:userId:)`, `ListsStore.updateList(_:title:emoji:isPublic:)`, `ListsStore.addRestaurant(listId:restaurantId:)`
- Produces: `CreateListSheet(editList:onCreated:)` — create or edit a list
- Produces: `AddToListSheet(restaurant:)` — add restaurant to an existing list

- [ ] **Step 1: Create CreateListSheet.swift**

```swift
import SwiftUI

struct CreateListSheet: View {
    let editList: RestaurantList?
    var onCreated: ((RestaurantList) -> Void)?

    @Environment(ListsStore.self) private var listsStore
    @Environment(AuthStore.self) private var authStore
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var emoji = ""
    @State private var isPublic = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(editList: RestaurantList? = nil, onCreated: ((RestaurantList) -> Void)? = nil) {
        self.editList = editList
        self.onCreated = onCreated
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        TextField("Emoji (optional)", text: $emoji)
                            .frame(width: 80)
                        Divider()
                        TextField("List name", text: $title)
                    }
                }

                Section {
                    Toggle("Public list", isOn: $isPublic)
                        .tint(Color.frAccent)
                }

                if let error = errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red).font(.caption)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.frBackground)
            .navigationTitle(editList == nil ? "New List" : "Edit List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.frAccent)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(editList == nil ? "Create" : "Save") {
                        Task { await save() }
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.frAccent)
                    .disabled(title.isEmpty || isSaving)
                }
            }
            .onAppear {
                if let list = editList {
                    title = list.title
                    emoji = list.emoji ?? ""
                    isPublic = list.isPublic
                }
            }
        }
    }

    private func save() async {
        guard let userId = authStore.session?.user.id.uuidString else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            let emojiValue: String? = emoji.isEmpty ? nil : emoji
            if let list = editList {
                try await listsStore.updateList(list, title: title, emoji: emojiValue, isPublic: isPublic)
                dismiss()
            } else {
                let created = try await listsStore.createList(
                    title: title, emoji: emojiValue, isPublic: isPublic, userId: userId
                )
                onCreated?(created)
                dismiss()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    CreateListSheet()
        .environment(ListsStore())
        .environment(AuthStore())
}
```

- [ ] **Step 2: Create AddToListSheet.swift**

```swift
import SwiftUI

struct AddToListSheet: View {
    let restaurant: Restaurant
    @Environment(ListsStore.self) private var listsStore
    @Environment(AuthStore.self) private var authStore
    @Environment(\.dismiss) private var dismiss
    @State private var savingListId: String? = nil
    @State private var savedListIds: Set<String> = []
    @State private var showCreate = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button {
                        showCreate = true
                    } label: {
                        Label("New list", systemImage: "plus.circle")
                            .foregroundStyle(Color.frAccent)
                    }
                }

                Section("My Lists") {
                    if listsStore.lists.isEmpty {
                        Text("No lists yet").foregroundStyle(Color.frText.opacity(0.5))
                    } else {
                        ForEach(listsStore.lists) { list in
                            Button {
                                Task { await toggleList(list) }
                            } label: {
                                HStack {
                                    Text(list.emoji ?? "📋")
                                    VStack(alignment: .leading) {
                                        Text(list.title).foregroundStyle(Color.frText)
                                    }
                                    Spacer()
                                    if savingListId == list.id {
                                        ProgressView()
                                    } else if savedListIds.contains(list.id) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(Color.frAccent)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.frBackground)
            .navigationTitle("Add to List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color.frAccent)
                        .fontWeight(.semibold)
                }
            }
            .onAppear {
                if let uid = authStore.session?.user.id.uuidString {
                    Task { await listsStore.fetchLists(userId: uid) }
                }
            }
        }
        .sheet(isPresented: $showCreate) {
            CreateListSheet()
                .environment(listsStore)
                .environment(authStore)
        }
    }

    private func toggleList(_ list: RestaurantList) async {
        savingListId = list.id
        defer { savingListId = nil }
        do {
            if savedListIds.contains(list.id) {
                try await listsStore.removeRestaurant(listId: list.id, restaurantId: restaurant.id)
                savedListIds.remove(list.id)
            } else {
                try await listsStore.addRestaurant(listId: list.id, restaurantId: restaurant.id)
                savedListIds.insert(list.id)
            }
        } catch {
            print("[AddToListSheet] error: \(error)")
        }
    }
}
```

- [ ] **Step 3: Replace AddToList stub in RatingSection**

In `FoodRaccoon/Restaurant/RatingSection.swift`, replace the `showAddToList` sheet content:

```swift
.sheet(isPresented: $showAddToList) {
    AddToListSheet(restaurant: restaurant)
        .environment(ListsStore())
        .environment(authStore)
        .presentationDetents([.medium, .large])
}
```

Note: In production, `ListsStore()` should come from `.environment(listsStore)` injected from `FoodRaccoonApp`. Update `FoodRaccoonApp.swift` to pass `listsStore` through all the way to `RatingSection`. The quickest fix is to use `@Environment(ListsStore.self)` in `RatingSection` and ensure it's in the environment chain from `FoodRaccoonApp`.

In `RatingSection.swift`, add `@Environment(ListsStore.self) private var listsStore` and change the sheet to:

```swift
.sheet(isPresented: $showAddToList) {
    AddToListSheet(restaurant: restaurant)
        .presentationDetents([.medium, .large])
}
```

- [ ] **Step 4: Build**

Cmd+B. Clean compile.

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Lists/CreateListSheet.swift \
        FoodRaccoon/Lists/AddToListSheet.swift \
        FoodRaccoon/Restaurant/RatingSection.swift
git commit -m "feat: CreateListSheet, AddToListSheet, wire add-to-list in RatingSection"
```

---

### Task 3: ListsView + ListDetailView

**Files:**
- Create: `FoodRaccoon/Lists/ListsView.swift`
- Create: `FoodRaccoon/Lists/ListDetailView.swift`
- Modify: `FoodRaccoon/App/MainTabView.swift`

**Interfaces:**
- Consumes: `ListsStore.fetchLists(userId:)`, `ListsStore.lists`, `ListsStore.deleteList(id:)`
- Consumes: `RestaurantStore.statusMap` (for fixed lists: want-to-try, visited, favourites)
- Produces: `ListsView` — 3 fixed lists + custom lists with swipe-to-delete
- Produces: `ListDetailView(list:)` — restaurant members of a custom list

- [ ] **Step 1: Create ListDetailView.swift**

```swift
import SwiftUI

struct ListDetailView: View {
    let list: RestaurantList
    @Environment(ListsStore.self) private var listsStore
    @Environment(RestaurantStore.self) private var restaurantStore
    @State private var members: [ListRestaurant] = []
    @State private var isLoading = false
    @State private var showEdit = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else if members.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 48))
                        .foregroundStyle(Color.frBorder)
                    Text("No restaurants yet")
                        .foregroundStyle(Color.frText.opacity(0.5))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.frBackground)
            } else {
                List {
                    ForEach(members, id: \.restaurantId) { member in
                        if let restaurant = member.restaurant {
                            NavigationLink(destination:
                                RestaurantDetailView(restaurant: restaurant)
                                    .environment(restaurantStore)
                                    .environment(AuthStore())
                            ) {
                                ListRestaurantRow(restaurant: restaurant,
                                                 status: restaurantStore.statusMap[restaurant.id])
                            }
                        }
                    }
                    .onDelete { indexSet in
                        Task {
                            for idx in indexSet {
                                let member = members[idx]
                                try? await listsStore.removeRestaurant(
                                    listId: list.id,
                                    restaurantId: member.restaurantId
                                )
                                members.remove(at: idx)
                            }
                        }
                    }
                }
                .scrollContentBackground(.hidden)
                .background(Color.frBackground)
            }
        }
        .navigationTitle("\(list.emoji ?? "") \(list.title)")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showEdit = true } label: {
                    Image(systemName: "pencil")
                }
                .foregroundStyle(Color.frAccent)
            }
        }
        .task { await loadMembers() }
        .sheet(isPresented: $showEdit) {
            CreateListSheet(editList: list)
                .environment(listsStore)
                .environment(AuthStore())
        }
    }

    private func loadMembers() async {
        isLoading = true
        defer { isLoading = false }
        do {
            members = try await listsStore.fetchListRestaurants(listId: list.id)
        } catch {
            print("[ListDetailView] load error: \(error)")
        }
    }
}

struct ListRestaurantRow: View {
    let restaurant: Restaurant
    let status: RestaurantStatus?

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: restaurant.coverPhotoUrl.flatMap(URL.init)) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Color.frCard
            }
            .frame(width: 56, height: 56)
            .cornerRadius(8)
            .clipped()

            VStack(alignment: .leading, spacing: 3) {
                Text(restaurant.name)
                    .font(.subheadline.bold())
                    .foregroundStyle(Color.frText)
                Text([restaurant.cuisineType.first, restaurant.district].compactMap { $0 }.joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(Color.frText.opacity(0.6))
                if let status {
                    StatusBadge(status: status)
                        .scaleEffect(0.85, anchor: .leading)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
```

- [ ] **Step 2: Create ListsView.swift**

```swift
import SwiftUI

struct ListsView: View {
    @Environment(ListsStore.self) private var listsStore
    @Environment(RestaurantStore.self) private var restaurantStore
    @Environment(AuthStore.self) private var authStore
    @State private var showCreate = false

    private var wantToTry: [Restaurant] {
        restaurantStore.restaurants.filter {
            restaurantStore.statusMap[$0.id] == .wantToTry
        }
    }
    private var visited: [Restaurant] {
        restaurantStore.restaurants.filter {
            restaurantStore.statusMap[$0.id] == .visited
        }
    }
    private var favourites: [Restaurant] {
        restaurantStore.restaurants.filter {
            restaurantStore.statusMap[$0.id] == .favourite
        }
    }

    var body: some View {
        NavigationStack {
            List {
                // Fixed lists
                Section("Saved") {
                    fixedListRow(
                        title: "Want to try",
                        emoji: "🔖",
                        count: wantToTry.count,
                        destination: FixedListDetailView(title: "Want to try", restaurants: wantToTry)
                    )
                    fixedListRow(
                        title: "Visited",
                        emoji: "✅",
                        count: visited.count,
                        destination: FixedListDetailView(title: "Visited", restaurants: visited)
                    )
                    fixedListRow(
                        title: "Favourites",
                        emoji: "❤️",
                        count: favourites.count,
                        destination: FixedListDetailView(title: "Favourites", restaurants: favourites)
                    )
                }

                // Custom lists
                if !listsStore.lists.isEmpty {
                    Section("My Lists") {
                        ForEach(listsStore.lists) { list in
                            NavigationLink(destination:
                                ListDetailView(list: list)
                                    .environment(listsStore)
                                    .environment(restaurantStore)
                            ) {
                                HStack(spacing: 12) {
                                    Text(list.emoji ?? "📋")
                                        .font(.title2)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(list.title)
                                            .font(.subheadline.bold())
                                            .foregroundStyle(Color.frText)
                                        Text("\(list.restaurantCount) places")
                                            .font(.caption)
                                            .foregroundStyle(Color.frText.opacity(0.6))
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                        }
                        .onDelete { indexSet in
                            Task {
                                for idx in indexSet {
                                    let list = listsStore.lists[idx]
                                    try? await listsStore.deleteList(id: list.id)
                                }
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.frBackground)
            .navigationTitle("Lists")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    AuthGateButton(action: { showCreate = true }) {
                        Image(systemName: "plus")
                            .foregroundStyle(Color.frAccent)
                    }
                }
            }
            .task {
                if let uid = authStore.session?.user.id.uuidString {
                    await listsStore.fetchLists(userId: uid)
                }
            }
        }
        .sheet(isPresented: $showCreate) {
            CreateListSheet()
                .environment(listsStore)
                .environment(authStore)
        }
    }

    private func fixedListRow<Dest: View>(title: String, emoji: String, count: Int, destination: Dest) -> some View {
        NavigationLink(destination: destination.environment(restaurantStore)) {
            HStack(spacing: 12) {
                Text(emoji).font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundStyle(Color.frText)
                    Text("\(count) places")
                        .font(.caption)
                        .foregroundStyle(Color.frText.opacity(0.6))
                }
            }
            .padding(.vertical, 4)
        }
    }
}

struct FixedListDetailView: View {
    let title: String
    let restaurants: [Restaurant]
    @Environment(RestaurantStore.self) private var restaurantStore

    var body: some View {
        Group {
            if restaurants.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 48))
                        .foregroundStyle(Color.frBorder)
                    Text("Nothing here yet")
                        .foregroundStyle(Color.frText.opacity(0.5))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.frBackground)
            } else {
                List(restaurants) { restaurant in
                    NavigationLink(destination:
                        RestaurantDetailView(restaurant: restaurant)
                            .environment(restaurantStore)
                            .environment(AuthStore())
                    ) {
                        ListRestaurantRow(restaurant: restaurant,
                                         status: restaurantStore.statusMap[restaurant.id])
                    }
                }
                .scrollContentBackground(.hidden)
                .background(Color.frBackground)
            }
        }
        .navigationTitle(title)
    }
}
```

- [ ] **Step 3: Wire Lists tab in MainTabView**

In `MainTabView.swift`, replace the Lists stub:

```swift
NavigationStack {
    ListsView()
}
.tabItem { Label("Lists", systemImage: "list.bullet") }
```

- [ ] **Step 4: Build and run**

Cmd+R. Lists tab shows 3 fixed lists with counts. Tap "Want to try" → FixedListDetailView. Create list → CreateListSheet → appears in "My Lists". Swipe to delete custom list. ✓

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Lists/ListsView.swift FoodRaccoon/Lists/ListDetailView.swift \
        FoodRaccoon/App/MainTabView.swift
git commit -m "feat: ListsView (fixed + custom), ListDetailView with swipe-to-delete"
```

---

### Task 4: PublicListView

**Files:**
- Create: `FoodRaccoon/Lists/PublicListView.swift`

**Interfaces:**
- Consumes: `RestaurantList`, `[ListRestaurant]`
- Produces: `PublicListView(username:slug:)` — no auth required; fetches list via `api/lists/user/[username]/[slug]` equivalent Supabase query

- [ ] **Step 1: Create PublicListView.swift**

```swift
import SwiftUI

struct PublicListView: View {
    let username: String
    let slug: String
    @State private var list: RestaurantList? = nil
    @State private var members: [ListRestaurant] = []
    @State private var isLoading = true
    @State private var error: String? = nil

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.frBackground)
            } else if let error {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 40))
                        .foregroundStyle(Color.frBorder)
                    Text(error)
                        .foregroundStyle(Color.frText.opacity(0.6))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.frBackground)
            } else if let list {
                List {
                    Section {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(list.emoji ?? "") \(list.title)")
                                .font(.title2.bold())
                                .foregroundStyle(Color.frText)
                            Text("By @\(username)")
                                .font(.subheadline)
                                .foregroundStyle(Color.frText.opacity(0.6))
                            Text("\(members.count) places")
                                .font(.caption)
                                .foregroundStyle(Color.frText.opacity(0.5))
                        }
                        .padding(.vertical, 4)
                    }

                    Section {
                        ForEach(members, id: \.restaurantId) { member in
                            if let restaurant = member.restaurant {
                                HStack(spacing: 12) {
                                    AsyncImage(url: restaurant.coverPhotoUrl.flatMap(URL.init)) { image in
                                        image.resizable().scaledToFill()
                                    } placeholder: { Color.frCard }
                                    .frame(width: 52, height: 52)
                                    .cornerRadius(8)
                                    .clipped()

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(restaurant.name)
                                            .font(.subheadline.bold())
                                            .foregroundStyle(Color.frText)
                                        Text([restaurant.cuisineType.first, restaurant.district]
                                            .compactMap { $0 }.joined(separator: " · "))
                                            .font(.caption)
                                            .foregroundStyle(Color.frText.opacity(0.6))
                                    }
                                }
                            }
                        }
                    }
                }
                .scrollContentBackground(.hidden)
                .background(Color.frBackground)
                .navigationTitle(list.title)
                .navigationBarTitleDisplayMode(.inline)
            }
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            // Find profile by username
            let profiles: [UserProfile] = try await supabase
                .from("profiles")
                .select()
                .eq("username", value: username)
                .limit(1)
                .execute()
                .value

            guard let profile = profiles.first else {
                error = "User not found"; return
            }

            // Find list by user_id + slug
            let lists: [RestaurantList] = try await supabase
                .from("lists")
                .select()
                .eq("user_id", value: profile.id)
                .eq("slug", value: slug)
                .eq("is_public", value: true)
                .limit(1)
                .execute()
                .value

            guard let found = lists.first else {
                error = "List not found"; return
            }
            list = found

            // Fetch members
            members = try await supabase
                .from("list_restaurants")
                .select("*, restaurants(*)")
                .eq("list_id", value: found.id)
                .order("added_at", ascending: false)
                .execute()
                .value
        } catch {
            self.error = error.localizedDescription
        }
    }
}
```

- [ ] **Step 2: Build**

Cmd+B. Compiles.

- [ ] **Step 3: Commit**

```bash
git add FoodRaccoon/Lists/PublicListView.swift
git commit -m "feat: PublicListView for shared lists (no auth required)"
```

---

### Task 5: FeedView

**Files:**
- Create: `FoodRaccoon/Feed/FeedView.swift`
- Modify: `FoodRaccoon/App/MainTabView.swift`

**Interfaces:**
- Consumes: `AuthStore.session`, `RestaurantStore`
- Produces: `FeedView` — activity feed of people you follow, cursor-paginated by `updated_at`

- [ ] **Step 1: Create FeedView.swift**

```swift
import SwiftUI

private let feedPageSize = 20

struct FeedView: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(RestaurantStore.self) private var restaurantStore
    @State private var items: [FeedItem] = []
    @State private var isLoading = false
    @State private var cursor: String? = nil
    @State private var hasMore = true

    var body: some View {
        NavigationStack {
            Group {
                if authStore.session == nil {
                    signInPrompt
                } else if isLoading && items.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if items.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "person.2")
                            .font(.system(size: 48))
                            .foregroundStyle(Color.frBorder)
                        Text("Follow people to see their activity")
                            .foregroundStyle(Color.frText.opacity(0.5))
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.frBackground)
                } else {
                    List {
                        ForEach(items) { item in
                            FeedItemRow(item: item)
                                .listRowBackground(Color.frBackground)
                                .listRowSeparator(.hidden)
                        }

                        if hasMore {
                            Button("Load more") {
                                Task { await loadMore() }
                            }
                            .frame(maxWidth: .infinity, alignment: .center)
                            .foregroundStyle(Color.frAccent)
                            .listRowBackground(Color.frBackground)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .background(Color.frBackground)
                }
            }
            .navigationTitle("Feed")
            .task {
                if authStore.session != nil && items.isEmpty {
                    await loadFeed()
                }
            }
            .refreshable {
                cursor = nil
                hasMore = true
                items = []
                await loadFeed()
            }
        }
    }

    private var signInPrompt: some View {
        VStack(spacing: 16) {
            Image(systemName: "bell.slash")
                .font(.system(size: 48))
                .foregroundStyle(Color.frBorder)
            Text("Sign in to see your feed")
                .font(.headline)
                .foregroundStyle(Color.frText)
            AuthGateButton(action: {}) {
                Text("Sign In")
                    .frame(width: 160)
                    .padding(12)
                    .background(Color.frAccent)
                    .foregroundStyle(.white)
                    .cornerRadius(10)
                    .fontWeight(.semibold)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.frBackground)
    }

    private func loadFeed() async {
        guard let uid = authStore.session?.user.id.uuidString else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            // Get IDs of people this user follows
            let follows: [[String: String]] = try await supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", value: uid)
                .execute()
                .value

            let followingIds = follows.compactMap { $0["following_id"] }
            guard !followingIds.isEmpty else { hasMore = false; return }

            var query = supabase
                .from("user_restaurants")
                .select("*, profiles(*), restaurants(*)")
                .in("user_id", values: followingIds)
                .eq("is_public", value: true)
                .order("updated_at", ascending: false)
                .limit(feedPageSize)

            if let c = cursor {
                query = query.lt("updated_at", value: c)
            }

            let fetched: [FeedItem] = try await query.execute().value
            items.append(contentsOf: fetched)
            cursor = fetched.last?.updatedAt
            hasMore = fetched.count == feedPageSize
        } catch {
            print("[FeedView] load error: \(error)")
        }
    }

    private func loadMore() async {
        await loadFeed()
    }
}

struct FeedItemRow: View {
    let item: FeedItem
    @Environment(RestaurantStore.self) private var restaurantStore

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Avatar
            Circle()
                .fill(Color.frCard)
                .frame(width: 40, height: 40)
                .overlay(
                    Text(item.profile?.displayLabel.first.map(String.init) ?? "?")
                        .font(.headline)
                        .foregroundStyle(Color.frText)
                )

            VStack(alignment: .leading, spacing: 6) {
                // Header
                HStack(spacing: 4) {
                    Text(item.profile?.displayLabel ?? "Someone")
                        .font(.subheadline.bold())
                        .foregroundStyle(Color.frText)
                    if let status = item.status {
                        Text(statusVerb(status))
                            .font(.subheadline)
                            .foregroundStyle(Color.frText.opacity(0.7))
                    }
                    Spacer()
                    let date = ISO8601DateFormatter().date(from: item.updatedAt) ?? Date()
                    Text(date.relativeString)
                        .font(.caption)
                        .foregroundStyle(Color.frText.opacity(0.4))
                }

                // Restaurant card
                if let restaurant = item.restaurant {
                    HStack(spacing: 10) {
                        AsyncImage(url: restaurant.coverPhotoUrl.flatMap(URL.init)) { image in
                            image.resizable().scaledToFill()
                        } placeholder: { Color.frCard }
                        .frame(width: 48, height: 48)
                        .cornerRadius(8)
                        .clipped()

                        VStack(alignment: .leading, spacing: 2) {
                            Text(restaurant.name)
                                .font(.subheadline.bold())
                                .foregroundStyle(Color.frText)
                            if let status = item.status {
                                StatusBadge(status: status)
                                    .scaleEffect(0.8, anchor: .leading)
                            }
                        }
                    }
                    .padding(10)
                    .background(Color.frCard)
                    .cornerRadius(10)
                }

                // Rating + review
                if let rating = item.rating {
                    Text("Rating: \(rating)/10")
                        .font(.caption)
                        .foregroundStyle(Color.frAccent)
                }
                if let review = item.review, !review.isEmpty {
                    Text(review)
                        .font(.caption)
                        .foregroundStyle(Color.frText.opacity(0.7))
                        .lineLimit(3)
                }
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 16)
    }

    private func statusVerb(_ status: RestaurantStatus) -> String {
        switch status {
        case .wantToTry: return "wants to try"
        case .visited:   return "visited"
        case .favourite: return "favourited"
        }
    }
}
```

- [ ] **Step 2: Wire Feed tab in MainTabView**

In `MainTabView.swift`, replace the Feed stub:

```swift
NavigationStack {
    FeedView()
}
.tabItem { Label("Feed", systemImage: "bell.fill") }
```

- [ ] **Step 3: Build and run**

Cmd+R. Feed tab — unauthenticated: sign-in prompt. Authenticated + follows nobody: empty state. After following users (done in Task 7): activity appears. Pull to refresh → reloads from top. "Load more" → appends next page. ✓

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Feed/FeedView.swift FoodRaccoon/App/MainTabView.swift
git commit -m "feat: FeedView with cursor pagination and follow-gated activity"
```

---

### Task 6: ProfileView (own profile)

**Files:**
- Create: `FoodRaccoon/Profile/ProfileView.swift`
- Modify: `FoodRaccoon/App/MainTabView.swift`

**Interfaces:**
- Consumes: `AuthStore.session`, `AuthStore.profile`, `ListsStore`, `RestaurantStore.statusMap`
- Produces: `ProfileView` — own profile tab with stats, lists, sign out

- [ ] **Step 1: Create ProfileView.swift**

```swift
import SwiftUI

struct ProfileView: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(ListsStore.self) private var listsStore
    @Environment(RestaurantStore.self) private var restaurantStore
    @State private var showEdit = false
    @State private var showSignOutConfirm = false

    private var profile: UserProfile? { authStore.profile }

    private var visitedCount: Int {
        restaurantStore.statusMap.values.filter { $0 == .visited }.count
    }
    private var wantToTryCount: Int {
        restaurantStore.statusMap.values.filter { $0 == .wantToTry }.count
    }

    var body: some View {
        NavigationStack {
            Group {
                if authStore.session == nil {
                    signInPrompt
                } else {
                    ScrollView {
                        VStack(spacing: 0) {
                            // Avatar + name
                            VStack(spacing: 10) {
                                Circle()
                                    .fill(Color.frCard)
                                    .frame(width: 80, height: 80)
                                    .overlay(
                                        Text(profile?.displayLabel.first.map(String.init) ?? "?")
                                            .font(.largeTitle)
                                            .foregroundStyle(Color.frText)
                                    )

                                VStack(spacing: 4) {
                                    Text(profile?.displayLabel ?? "")
                                        .font(.title3.bold())
                                        .foregroundStyle(Color.frText)
                                    if let username = profile?.username {
                                        Text("@\(username)")
                                            .font(.subheadline)
                                            .foregroundStyle(Color.frText.opacity(0.6))
                                    }
                                    if let bio = profile?.bio, !bio.isEmpty {
                                        Text(bio)
                                            .font(.callout)
                                            .foregroundStyle(Color.frText.opacity(0.7))
                                            .multilineTextAlignment(.center)
                                    }
                                }
                            }
                            .padding(.top, 24)
                            .padding(.bottom, 20)

                            // Stats
                            HStack(spacing: 0) {
                                statCell(value: visitedCount, label: "Visited")
                                Divider().frame(height: 40)
                                statCell(value: wantToTryCount, label: "Want to try")
                                Divider().frame(height: 40)
                                statCell(value: profile?.followersCount ?? 0, label: "Followers")
                                Divider().frame(height: 40)
                                statCell(value: profile?.followingCount ?? 0, label: "Following")
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(Color.frCard)
                            .cornerRadius(12)
                            .padding(.horizontal, 16)

                            // Lists
                            if !listsStore.lists.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("My Lists")
                                        .font(.headline)
                                        .foregroundStyle(Color.frText)
                                        .padding(.horizontal, 16)

                                    ForEach(listsStore.lists.prefix(5)) { list in
                                        NavigationLink(destination:
                                            ListDetailView(list: list)
                                                .environment(listsStore)
                                                .environment(restaurantStore)
                                        ) {
                                            HStack(spacing: 12) {
                                                Text(list.emoji ?? "📋").font(.title2)
                                                VStack(alignment: .leading, spacing: 2) {
                                                    Text(list.title)
                                                        .font(.subheadline.bold())
                                                        .foregroundStyle(Color.frText)
                                                }
                                                Spacer()
                                                Image(systemName: "chevron.right")
                                                    .font(.caption)
                                                    .foregroundStyle(Color.frBorder)
                                            }
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 10)
                                        }
                                        Divider().padding(.leading, 60)
                                    }
                                }
                                .padding(.top, 20)
                            }
                        }
                    }
                    .background(Color.frBackground)
                }
            }
            .navigationTitle("Profile")
            .toolbar {
                if authStore.session != nil {
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Button { showEdit = true } label: {
                                Label("Edit profile", systemImage: "pencil")
                            }
                            Button(role: .destructive) { showSignOutConfirm = true } label: {
                                Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                                .foregroundStyle(Color.frAccent)
                        }
                    }
                }
            }
            .task {
                if let uid = authStore.session?.user.id.uuidString {
                    await listsStore.fetchLists(userId: uid)
                }
            }
            .sheet(isPresented: $showEdit) {
                EditProfileSheet()
                    .environment(authStore)
            }
            .confirmationDialog("Sign out?", isPresented: $showSignOutConfirm, titleVisibility: .visible) {
                Button("Sign out", role: .destructive) {
                    Task { try? await authStore.signOut() }
                }
            }
        }
    }

    private func statCell(value: Int, label: String) -> some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.title3.bold())
                .foregroundStyle(Color.frText)
            Text(label)
                .font(.caption)
                .foregroundStyle(Color.frText.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
    }

    private var signInPrompt: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.circle")
                .font(.system(size: 64))
                .foregroundStyle(Color.frBorder)
            Text("Sign in to view your profile")
                .font(.headline)
                .foregroundStyle(Color.frText)
            AuthGateButton(action: {}) {
                Text("Sign In")
                    .frame(width: 160)
                    .padding(12)
                    .background(Color.frAccent)
                    .foregroundStyle(.white)
                    .cornerRadius(10)
                    .fontWeight(.semibold)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.frBackground)
    }
}
```

- [ ] **Step 2: Wire Profile tab in MainTabView**

In `MainTabView.swift`, replace the Profile stub:

```swift
NavigationStack {
    ProfileView()
}
.tabItem { Label("Profile", systemImage: "person.fill") }
```

- [ ] **Step 3: Build and run**

Cmd+R. Profile tab: unauthenticated → sign-in prompt. Signed in → username, stats, lists. Menu → Edit profile (stub), Sign out. ✓

- [ ] **Step 4: Commit**

```bash
git add FoodRaccoon/Profile/ProfileView.swift FoodRaccoon/App/MainTabView.swift
git commit -m "feat: ProfileView with stats, lists preview, sign out"
```

---

### Task 7: EditProfileSheet

**Files:**
- Create: `FoodRaccoon/Profile/EditProfileSheet.swift`

**Interfaces:**
- Consumes: `AuthStore.profile`, updates via `supabase.from("profiles").update(...)`
- Produces: `EditProfileSheet` — edit display_name, username, bio; updates `AuthStore.profile`

- [ ] **Step 1: Create EditProfileSheet.swift**

```swift
import SwiftUI

struct EditProfileSheet: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(\.dismiss) private var dismiss
    @State private var displayName = ""
    @State private var username = ""
    @State private var bio = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Display Name") {
                    TextField("Your name", text: $displayName)
                        .foregroundStyle(Color.frText)
                }
                Section("Username") {
                    HStack {
                        Text("@").foregroundStyle(Color.frText.opacity(0.5))
                        TextField("username", text: $username)
                            .autocapitalization(.none)
                            .foregroundStyle(Color.frText)
                    }
                }
                Section("Bio") {
                    TextEditor(text: $bio)
                        .frame(minHeight: 80)
                        .foregroundStyle(Color.frText)
                }
                if let error = errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red).font(.caption)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.frBackground)
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.frAccent)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.frAccent)
                        .disabled(isSaving || username.isEmpty)
                }
            }
            .onAppear {
                displayName = authStore.profile?.displayName ?? ""
                username    = authStore.profile?.username ?? ""
                bio         = authStore.profile?.bio ?? ""
            }
        }
    }

    private func save() async {
        guard let uid = authStore.session?.user.id.uuidString else { return }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil

        let cleanUsername = username.lowercased().trimmingCharacters(in: .whitespaces)
        guard !cleanUsername.isEmpty else { errorMessage = "Username required"; return }

        do {
            try await supabase
                .from("profiles")
                .update([
                    "display_name": displayName.isEmpty ? nil : displayName,
                    "username": cleanUsername,
                    "bio": bio.isEmpty ? nil : bio,
                ])
                .eq("id", value: uid)
                .execute()

            // Refresh profile in store
            let updated: UserProfile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: uid)
                .single()
                .execute()
                .value

            await MainActor.run { authStore.profile = updated }
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    EditProfileSheet()
        .environment(AuthStore())
}
```

- [ ] **Step 2: Build and run**

Cmd+R. Profile → menu → Edit profile → form pre-filled. Change username → save → profile updates. ✓

- [ ] **Step 3: Commit**

```bash
git add FoodRaccoon/Profile/EditProfileSheet.swift
git commit -m "feat: EditProfileSheet with display_name, username, bio"
```

---

### Task 8: PublicProfileView + FollowSheet

**Files:**
- Create: `FoodRaccoon/Profile/PublicProfileView.swift` (replaces stub in SearchView)
- Create: `FoodRaccoon/Profile/FollowSheet.swift`
- Modify: `FoodRaccoon/Search/SearchView.swift`

**Interfaces:**
- Consumes: `AuthStore.session`; calls `follows` table for follow/unfollow
- Produces: `PublicProfileView(username:)` — other user's profile with follow button, lists
- Produces: `FollowSheet(userId:kind:)` where `kind` is `.followers` or `.following`

- [ ] **Step 1: Create FollowSheet.swift**

```swift
import SwiftUI

enum FollowKind { case followers, following }

struct FollowSheet: View {
    let userId: String
    let kind: FollowKind
    @State private var profiles: [UserProfile] = []
    @State private var isLoading = true
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                } else if profiles.isEmpty {
                    Text(kind == .followers ? "No followers yet" : "Not following anyone")
                        .foregroundStyle(Color.frText.opacity(0.5))
                } else {
                    List(profiles) { profile in
                        NavigationLink(destination: PublicProfileView(username: profile.username ?? "")) {
                            HStack(spacing: 12) {
                                Circle().fill(Color.frCard).frame(width: 40, height: 40)
                                    .overlay(Text(profile.displayLabel.first.map(String.init) ?? "?")
                                        .font(.headline).foregroundStyle(Color.frText))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(profile.displayLabel).font(.subheadline.bold()).foregroundStyle(Color.frText)
                                    if let u = profile.username {
                                        Text("@\(u)").font(.caption).foregroundStyle(Color.frText.opacity(0.6))
                                    }
                                }
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                    .background(Color.frBackground)
                }
            }
            .navigationTitle(kind == .followers ? "Followers" : "Following")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }.foregroundStyle(Color.frAccent)
                }
            }
            .task { await load() }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            if kind == .followers {
                let rows: [[String: String]] = try await supabase
                    .from("follows")
                    .select("follower_id")
                    .eq("following_id", value: userId)
                    .execute()
                    .value
                let ids = rows.compactMap { $0["follower_id"] }
                if ids.isEmpty { return }
                profiles = try await supabase
                    .from("profiles").select().in("id", values: ids).execute().value
            } else {
                let rows: [[String: String]] = try await supabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", value: userId)
                    .execute()
                    .value
                let ids = rows.compactMap { $0["following_id"] }
                if ids.isEmpty { return }
                profiles = try await supabase
                    .from("profiles").select().in("id", values: ids).execute().value
            }
        } catch {
            print("[FollowSheet] error: \(error)")
        }
    }
}
```

- [ ] **Step 2: Create PublicProfileView.swift**

Replace the stub in `SearchView.swift` with a real file. Delete the stub `struct PublicProfileView` from `SearchView.swift`, then create:

```swift
import SwiftUI

struct PublicProfileView: View {
    let username: String
    @Environment(AuthStore.self) private var authStore
    @State private var profile: UserProfile? = nil
    @State private var lists: [RestaurantList] = []
    @State private var isFollowing = false
    @State private var isLoading = true
    @State private var isTogglingFollow = false
    @State private var showFollowers = false
    @State private var showFollowing = false

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if let profile {
                VStack(spacing: 0) {
                    // Avatar + name
                    VStack(spacing: 10) {
                        Circle()
                            .fill(Color.frCard)
                            .frame(width: 80, height: 80)
                            .overlay(
                                Text(profile.displayLabel.first.map(String.init) ?? "?")
                                    .font(.largeTitle).foregroundStyle(Color.frText)
                            )

                        VStack(spacing: 4) {
                            Text(profile.displayLabel)
                                .font(.title3.bold()).foregroundStyle(Color.frText)
                            Text("@\(username)")
                                .font(.subheadline).foregroundStyle(Color.frText.opacity(0.6))
                            if let bio = profile.bio, !bio.isEmpty {
                                Text(bio).font(.callout)
                                    .foregroundStyle(Color.frText.opacity(0.7))
                                    .multilineTextAlignment(.center)
                            }
                        }

                        // Follow button
                        if authStore.session?.user.id.uuidString != profile.id {
                            AuthGateButton(action: { await toggleFollow(profileId: profile.id) }) {
                                Text(isFollowing ? "Unfollow" : "Follow")
                                    .font(.subheadline.bold())
                                    .frame(width: 120)
                                    .padding(.vertical, 8)
                                    .background(isFollowing ? Color.frCard : Color.frAccent)
                                    .foregroundStyle(isFollowing ? Color.frText : .white)
                                    .cornerRadius(20)
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.frBorder, lineWidth: isFollowing ? 1 : 0))
                            }
                            .disabled(isTogglingFollow)
                        }
                    }
                    .padding(.top, 20)
                    .padding(.bottom, 16)

                    // Stats
                    HStack(spacing: 0) {
                        Button { showFollowers = true } label: {
                            statCell(value: profile.followersCount, label: "Followers")
                        }
                        Divider().frame(height: 40)
                        Button { showFollowing = true } label: {
                            statCell(value: profile.followingCount, label: "Following")
                        }
                    }
                    .padding(.horizontal, 40)
                    .padding(.vertical, 12)
                    .background(Color.frCard)
                    .cornerRadius(12)
                    .padding(.horizontal, 16)

                    // Public lists
                    if !lists.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Lists")
                                .font(.headline).foregroundStyle(Color.frText)
                                .padding(.horizontal, 16)

                            ForEach(lists) { list in
                                NavigationLink(destination:
                                    PublicListView(username: username, slug: list.slug ?? "")
                                ) {
                                    HStack(spacing: 12) {
                                        Text(list.emoji ?? "📋").font(.title2)
                                        Text(list.title)
                                            .font(.subheadline.bold())
                                            .foregroundStyle(Color.frText)
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.caption).foregroundStyle(Color.frBorder)
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 10)
                                }
                                Divider().padding(.leading, 60)
                            }
                        }
                        .padding(.top, 20)
                    }
                }
            } else {
                Text("User not found").foregroundStyle(Color.frText.opacity(0.5)).padding(.top, 60)
            }
        }
        .background(Color.frBackground)
        .navigationTitle("@\(username)")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .sheet(isPresented: $showFollowers) {
            if let p = profile {
                FollowSheet(userId: p.id, kind: .followers)
                    .environment(authStore)
            }
        }
        .sheet(isPresented: $showFollowing) {
            if let p = profile {
                FollowSheet(userId: p.id, kind: .following)
                    .environment(authStore)
            }
        }
    }

    private func statCell(value: Int, label: String) -> some View {
        VStack(spacing: 2) {
            Text("\(value)").font(.title3.bold()).foregroundStyle(Color.frText)
            Text(label).font(.caption).foregroundStyle(Color.frText.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let profiles: [UserProfile] = try await supabase
                .from("profiles").select()
                .eq("username", value: username).limit(1).execute().value
            guard let p = profiles.first else { return }
            profile = p

            // Check if current user follows this profile
            if let uid = authStore.session?.user.id.uuidString {
                let follows: [[String: String]] = try await supabase
                    .from("follows").select("follower_id")
                    .eq("follower_id", value: uid)
                    .eq("following_id", value: p.id)
                    .execute().value
                isFollowing = !follows.isEmpty
            }

            // Public lists
            lists = try await supabase
                .from("lists").select()
                .eq("user_id", value: p.id)
                .eq("is_public", value: true)
                .order("created_at", ascending: false)
                .execute().value
        } catch {
            print("[PublicProfileView] load error: \(error)")
        }
    }

    private func toggleFollow(profileId: String) async {
        guard let uid = authStore.session?.user.id.uuidString else { return }
        isTogglingFollow = true
        defer { isTogglingFollow = false }
        do {
            if isFollowing {
                try await supabase.from("follows").delete()
                    .eq("follower_id", value: uid)
                    .eq("following_id", value: profileId)
                    .execute()
                isFollowing = false
                profile = profile.map {
                    var p = $0; return p
                }
            } else {
                try await supabase.from("follows")
                    .insert(["follower_id": uid, "following_id": profileId])
                    .execute()
                isFollowing = true
            }
        } catch {
            print("[PublicProfileView] follow error: \(error)")
        }
    }
}
```

- [ ] **Step 3: Remove stub from SearchView.swift**

In `FoodRaccoon/Search/SearchView.swift`, delete:

```swift
// Stub — replaced in Plan 3
struct PublicProfileView: View {
    let username: String
    var body: some View {
        Text("Profile: @\(username)").navigationTitle("@\(username)")
    }
}
```

The real `PublicProfileView` is now in `FoodRaccoon/Profile/PublicProfileView.swift`.

- [ ] **Step 4: Build and run**

Cmd+R. Search → tap a person → PublicProfileView with stats and follow button. Follow → button changes to "Unfollow". Tap followers count → FollowSheet. ✓

- [ ] **Step 5: Commit**

```bash
git add FoodRaccoon/Profile/PublicProfileView.swift \
        FoodRaccoon/Profile/FollowSheet.swift \
        FoodRaccoon/Search/SearchView.swift
git commit -m "feat: PublicProfileView with follow/unfollow and FollowSheet"
```

---

### Task 9: Full Parity Smoke Test

- [ ] **Step 1: Run all tests**

Cmd+U. Expected:
- ThemeTests: 5 pass
- ModelsTests: 3 pass
- AuthStoreTests: 2 pass
- RestaurantStoreTests: 6 pass
- UIImageCircleTests: 2 pass
- ListsStoreTests: 2 pass

All green.

- [ ] **Step 2: Full flow walkthrough on device**

Run on physical iPhone (Cmd+R with device selected):

1. **Auth:** Fresh install → onboarding → sign up → verify email → sign in ✓
2. **Map:** Markers load, tap → panel, status buttons → colour changes on marker ✓
3. **Restaurant detail:** Panel "More" → full detail view, rating slider ✓
4. **Filters:** Filter button → select cuisine → markers reduce ✓
5. **Map style:** Style picker → satellite → saves on relaunch ✓
6. **Search restaurants:** Type name → results → tap → detail view ✓
7. **Search people:** Type username → results → tap → PublicProfileView ✓
8. **Follow:** Follow a user → feed populates ✓
9. **Lists:** "Want to try" → fixed list. Create list → add restaurant via RatingSection ✓
10. **Feed:** Activity from followed users with cursor pagination ✓
11. **Profile:** Stats, lists, edit profile, sign out ✓
12. **Sign in with Apple:** Works on device (requires Apple Developer config) ✓

- [ ] **Step 3: Final commit + tag**

```bash
git add -A
git commit -m "chore: Plan 3 Social complete — full feature parity with web app"
git tag v1.0.0-ios
```

**FoodRaccoon iOS app complete. Full parity with web app achieved.**
