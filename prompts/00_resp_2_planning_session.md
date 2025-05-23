<pytania>
Jakie konkretne pola mają się znaleźć w układzie front/back – np. pole „podpowiedź” lub „przykład”, czy tylko pytanie i odpowiedź?
Czy dozwolone są podstawowe formatowania tekstu (np. podział na akapity, listy) mimo że to czysty tekst?
Czy tagi mają być wybierane z listy istniejących czy użytkownik może dodawać własne tagi dowolnie?
W jaki sposób użytkownik będzie oznaczał podczas przeglądu, że karta została przyswojona lub wymaga powtórki?
Jaką bazę danych i mechanizm uwierzytelniania planujemy wykorzystać do przechowywania fiszek i kont użytkowników?
W jaki sposób zbierzemy dane o akceptacji fiszek (np. przycisk „akceptuję” czy „odrzuć”)?
Czy przed ostatecznym terminem 16.05.2025 mamy zaplanowane kamienie milowe (np. prototyp, testy użytkowników, wdrożenie alfa)?
</pytania>
<rekomendacje>
Zdefiniować prosty schemat danych JSON dla układu front/back z opcjonalnym polem „podpowiedź”.
Wdrożyć edytor czystego tekstu z obsługą podstawowego formatowania (akapitów, list) i automatycznym zapisem.
Udostępnić użytkownikowi zarówno podpowiedzi tagów na podstawie istniejących, jak i możliwość dodawania własnych.
Zaprojektować prosty interfejs z dwoma przyciskami („Przyswojone”/„Wymaga powtórki”) do oznaczania wyników sesji.
Wybrać gotowe rozwiązanie typu Supabase lub Firebase do bazy i uwierzytelniania, aby przyspieszyć rozwój MVP.
Uwzględnić w interfejsie opcję szybkiego feedbacku „Akceptuję” lub „Popraw” bezpośrednio po wygenerowaniu fiszki.
Opracować harmonogram z kluczowymi kamieniami milowymi: prototyp do 01.03.2025, testy użytkowników do 15.04.2025, wdrożenie MVP do 16.05.2025.
</rekomendacje>
