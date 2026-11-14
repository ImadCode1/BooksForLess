import { useState } from "react";
import { ScrollView, StyleSheet, Text, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";
import { palette, ui } from "@/components/book-flow/ui";
import { useListingBooks } from "../data";
import TopBar from "../TopBar";
import FeaturedCatalog from "./components/FeaturedCatalog";
import HeroSearch from "./components/HeroSearch";
import RecentPosts from "./components/RecentPosts";
import Subjects from "./components/Subjects";

export default function LandingPage() {
  useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const books = useListingBooks();

  const filteredBooks = books.filter((book) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q);
    const matchesSubject =
      selectedSubject === "All" || book.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <SafeAreaView style={styles.screen} edges={{ top: process.env.EXPO_OS === 'android', left: true, right: true }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TopBar />
        <HeroSearch value={searchQuery} onChangeText={setSearchQuery} />
        <Subjects selected={selectedSubject} onSelect={setSelectedSubject} />
        {(searchQuery || selectedSubject !== "All") ?
          <Text accessibilityLiveRegion="polite" style={ui.caption}>{filteredBooks.length} matching books</Text>
        : null}
        <RecentPosts books={filteredBooks} />
        <FeaturedCatalog books={filteredBooks} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    ...ui.content,
    gap: 24,
    paddingTop: 8,
  },
});
