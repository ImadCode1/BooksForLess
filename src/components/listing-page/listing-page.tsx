import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FeaturedCatalog from "./components/FeaturedCatalog";
import HeroSearch from "./components/HeroSearch";
import RecentPosts from "./components/RecentPosts";
import Subjects from "./components/Subjects";
import TopBar from "./components/TopBar";
import { BOOKS } from "./data";

export default function ListingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  const filteredBooks = BOOKS.filter((book) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q);
    const matchesSubject =
      selectedSubject === "All" || book.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <TopBar notificationCount={1} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HeroSearch value={searchQuery} onChangeText={setSearchQuery} />
        <Subjects selected={selectedSubject} onSelect={setSelectedSubject} />
        <RecentPosts books={filteredBooks} />
        <FeaturedCatalog books={filteredBooks} />
      </ScrollView>

      {/* <BottomNav /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 110,
  },
});
