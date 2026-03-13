Dönüşümlü Kitap Dağıtım Programı
Github üzerinden render.com da çalışacak bir site olacak. 
Database kullanmak gerekirse mongodb atlas kullanılacak.
-Program mevcut kitap havuzundan sistemde kayıtlı öğrencilere kullanıcının istediği anda rastgele kitap dağıtımı yapacak. (haftalık veya günlük dağıtım yapılabilir.)

-Kitaplar öğrencilere dönüşümlü dağıtılacak.

-Bir kitabı okuyan öğrenci bir daha o kitabı alamayacak.

-Kullanıcı dağıtım yapacağı anda sınıfta olmayan veya kitabını getirmeyen öğrencileri listeden seçerek dağıtıma katmayacak. Bu yüzden program gelmeyen öğrencilerin kitaplarını dikkate alarak onları o dağıtıma mahsus dağıtım dışı bırakmalı.
(Örneğin 15 numaralı kitap Ali’de olsun. Ali bu hafta okula gelmedi. Bu yüzden 15 numaralı kitap dağıtıma katılamaz)

Ancak öğrenci sonraki dağıtımda sınıfta olursa tekrar dağıtıma girmeli. (Yani Ali diyelim ki sonraki hafta geldi. O nedenle 15 numaralı kitap tekrar dağıtıma girmeli.)

-Dağıtımdaki temel mantık, o anda sınıfta olan öğrencilerin kitapları birbiriyle değiştirmesidir. Aynı zamanda bu öğrenciler daha önce okuduğu bir kitabı tekrar almamalıdır.

-Ancak süreç ilerlediğinde (34 Kişilik bir sınıf için 32, 33 veya 34.dağıtımda) 1 öğrenci o anda sınıfta bulunan tüm kitapları okumuş olabilir. Okumadığı kitap ise o gün gelmeyen bir öğrencide olabilir. Bu durumda sistem uyarı vermeli. Örneğin (Ali, sınıftaki tüm kitapları okumuştur. Okumadığı 7 numaralı kitap gelmeyen İsmail adındaki öğrencidedir.)

-Sınıfa yeni bir öğrenci geldiğinde yeni öğrenci ve yeni kitap eklenebilmeli. Ya da sınıftan bir öğrenci gittiğinde listeden silinebilmeli.

-Kullanıcı hataen dağıtım yaptığında bu işlem geri alınabilmeli.

-Öğrencilerin kitap geçmişi istenildiğinde liste halinde görünebilmeli.

-Kullanıcı tüm dağıtım verilerini tek seferde silebilmeli ancak yanlışlıkla silmeye karşı sistem ek bir uyarı vermeli.

-Kullanıcı dağıtımdan önce gelmeyen öğrencileri seçmeli, seçimden sonra tek tuşla dağıtım yapmalı. Kitaplar 1 den başlayarak liste halinde görünmeli. Yani her dağıtımda liste 1 den başlayacak ancak yanına yazan Öğrenci isimleri değişecek.
