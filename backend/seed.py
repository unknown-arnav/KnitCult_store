"""Seed initial data: admin user + starter product catalog."""
import os
import logging
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from database import Base, engine, SessionLocal  # noqa: E402
from models import User, Product, Coupon  # noqa: E402
from auth_utils import hash_password  # noqa: E402

log = logging.getLogger("seed")
logging.basicConfig(level=logging.INFO)


PRODUCTS = [
    {
        "name": "Arsenal 2003-04 Invincibles Home",
        "price": 189.0,
        "image": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
        "images": [
            "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
            "https://images.unsplash.com/photo-1580087432740-40f4831b40e6?w=800",
        ],
        "description": "The legendary Invincibles unbeaten league season shirt. Match-grade fabric, embroidered crest.",
        "club": "Arsenal", "league": "Premier League", "era": "2000s", "year": "2003",
        "player": "Henry",
        "tags": "category:jersey,club:arsenal,league:premier-league,era:2000s,year:2003,player:henry,type:home,color:red",
        "stock": {"S": 5, "M": 8, "L": 10, "XL": 4},
        "is_trending": True,
        "historical_campaign": {
            "title": "The Invincibles",
            "subtitle": "38 games. Zero defeats.",
            "body": "Arsène Wenger's 2003-04 Arsenal side went the entire Premier League season without a single loss — a feat unmatched in the modern era. This shirt was worn during Thierry Henry's Golden Boot campaign.",
        },
    },
    {
        "name": "AC Milan 1989-90 Home",
        "price": 219.0,
        "image": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800",
        "images": ["https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800"],
        "description": "The Gullit, van Basten, Rijkaard era — European Cup back-to-back champions.",
        "club": "AC Milan", "league": "Serie A", "era": "1980s", "year": "1989",
        "player": "van Basten",
        "tags": "category:jersey,club:ac-milan,league:serie-a,era:1980s,year:1989,player:van-basten,type:home,color:red,color:black",
        "stock": {"S": 3, "M": 6, "L": 8, "XL": 2},
        "is_trending": True,
        "historical_campaign": {
            "title": "The Dutch Trio",
            "subtitle": "Back-to-back European kings",
            "body": "Sacchi's Milan won consecutive European Cups in 1989 and 1990 with a fearsome front line of Marco van Basten, Ruud Gullit, and Frank Rijkaard.",
        },
    },
    {
        "name": "Manchester United 1998-99 Treble Home",
        "price": 249.0,
        "image": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800",
        "images": ["https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800"],
        "description": "The Treble-winning shirt — Premier League, FA Cup, Champions League.",
        "club": "Manchester United", "league": "Premier League", "era": "1990s", "year": "1999",
        "player": "Beckham",
        "tags": "category:jersey,club:man-utd,league:premier-league,era:1990s,year:1999,player:beckham,type:home,color:red",
        "stock": {"S": 4, "M": 10, "L": 12, "XL": 6},
        "is_trending": True,
        "historical_campaign": {
            "title": "The Treble",
            "subtitle": "Camp Nou, injury time",
            "body": "Sir Alex Ferguson's United completed English football's only continental Treble with a stoppage-time comeback against Bayern Munich in the Champions League final.",
        },
    },
    {
        "name": "Brazil 1970 World Cup Home",
        "price": 279.0,
        "image": "https://images.unsplash.com/photo-1614632537190-23e4b2e69c88?w=800",
        "images": ["https://images.unsplash.com/photo-1614632537190-23e4b2e69c88?w=800"],
        "description": "Pelé's iconic canary yellow — arguably the greatest team ever assembled.",
        "club": "Brazil", "league": "International", "era": "1970s", "year": "1970",
        "player": "Pele",
        "tags": "category:jersey,club:brazil,league:international,era:1970s,year:1970,player:pele,type:home,color:yellow",
        "stock": {"S": 6, "M": 12, "L": 10, "XL": 5},
        "is_trending": True,
        "historical_campaign": {
            "title": "Jogo Bonito",
            "subtitle": "Mexico '70",
            "body": "Widely regarded as the finest international team of all time. Pelé, Jairzinho, Rivelino, Tostão, Gérson, Carlos Alberto — six of the eleven starters could have been captain of any other side.",
        },
    },
    {
        "name": "Liverpool 2005 Istanbul Home",
        "price": 199.0,
        "image": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
        "images": ["https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800"],
        "description": "The Miracle of Istanbul. 3-0 down at half time. Champions of Europe by midnight.",
        "club": "Liverpool", "league": "Premier League", "era": "2000s", "year": "2005",
        "player": "Gerrard",
        "tags": "category:jersey,club:liverpool,league:premier-league,era:2000s,year:2005,player:gerrard,type:home,color:red",
        "stock": {"S": 3, "M": 8, "L": 10, "XL": 4},
        "is_trending": True,
        "historical_campaign": {
            "title": "The Miracle of Istanbul",
            "subtitle": "3-0 down. 3-3. Champions.",
            "body": "Six minutes of madness in the second half saw Liverpool overturn a three-goal Milan lead, before Jerzy Dudek's saves crowned Rafa Benítez's side kings of Europe.",
        },
    },
    {
        "name": "Barcelona 2010-11 UCL Home",
        "price": 229.0,
        "image": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800",
        "images": ["https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800"],
        "description": "Pep's tiki-taka masterpiece. Wembley destruction of Manchester United.",
        "club": "Barcelona", "league": "La Liga", "era": "2010s", "year": "2011",
        "player": "Messi",
        "tags": "category:jersey,club:barcelona,league:la-liga,era:2010s,year:2011,player:messi,type:home,color:blue,color:red",
        "stock": {"S": 4, "M": 9, "L": 11, "XL": 5},
        "is_trending": True,
        "historical_campaign": {
            "title": "Tiki-Taka Perfection",
            "subtitle": "Wembley, May 28",
            "body": "Widely regarded as the peak of Pep Guardiola's Barcelona side. Messi, Xavi, Iniesta, Villa — a display of football many consider the greatest ever seen in a Champions League final.",
        },
    },
    {
        "name": "Argentina 1986 World Cup Home",
        "price": 259.0,
        "image": "https://images.unsplash.com/photo-1571019613914-85f342c1d4d1?w=800",
        "images": ["https://images.unsplash.com/photo-1571019613914-85f342c1d4d1?w=800"],
        "description": "Maradona's Mexico '86. The Hand of God. The Goal of the Century.",
        "club": "Argentina", "league": "International", "era": "1980s", "year": "1986",
        "player": "Maradona",
        "tags": "category:jersey,club:argentina,league:international,era:1980s,year:1986,player:maradona,type:home,color:blue,color:white",
        "stock": {"S": 5, "M": 10, "L": 8, "XL": 4},
        "is_trending": False,
        "historical_campaign": {
            "title": "The Hand of God",
            "subtitle": "Mexico '86",
            "body": "Diego Maradona's single-handed World Cup — literally and figuratively. Four minutes separated the most infamous and most brilliant goals in football history.",
        },
    },
    {
        "name": "Juventus 1996 UCL Home",
        "price": 209.0,
        "image": "https://images.unsplash.com/photo-1526676037777-05a232554d77?w=800",
        "images": ["https://images.unsplash.com/photo-1526676037777-05a232554d77?w=800"],
        "description": "Lippi's black-and-white kings — Del Piero, Zidane, Ronaldo era.",
        "club": "Juventus", "league": "Serie A", "era": "1990s", "year": "1996",
        "player": "Del Piero",
        "tags": "category:jersey,club:juventus,league:serie-a,era:1990s,year:1996,player:del-piero,type:home,color:black,color:white",
        "stock": {"S": 4, "M": 7, "L": 9, "XL": 3},
        "is_trending": False,
    },
]


def seed_admin(db):
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_password = os.environ["ADMIN_PASSWORD"]
    admin = db.query(User).filter(User.email == admin_email).first()
    if admin:
        # Ensure role is admin and password/is_verified are current
        admin.role = "admin"
        admin.is_verified = True
        admin.hashed_password = hash_password(admin_password)
        db.commit()
        log.info("Admin user updated: %s", admin_email)
        return
    admin = User(
        email=admin_email,
        hashed_password=hash_password(admin_password),
        name="KnitCult Admin",
        role="admin",
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    log.info("Admin user created: %s", admin_email)


def _slugify(name: str) -> str:
    import re
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", name).strip().lower()
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug


def seed_products(db):
    count = 0
    for p in PRODUCTS:
        slug = _slugify(p["name"])
        if db.query(Product).filter(Product.slug == slug).first():
            continue
        prod = Product(
            name=p["name"],
            slug=slug,
            price=p["price"],
            image=p["image"],
            images=p.get("images", []),
            description=p.get("description", ""),
            club=p.get("club", ""),
            league=p.get("league", ""),
            era=p.get("era", ""),
            year=p.get("year", ""),
            player=p.get("player", ""),
            tags=p.get("tags", ""),
            stock=p.get("stock", {}),
            is_trending=p.get("is_trending", False),
            historical_campaign=p.get("historical_campaign", {}),
            rating=4.9,
            reviews_count=127,
        )
        db.add(prod)
        count += 1
    db.commit()
    log.info("Seeded %d products", count)


def seed_coupons(db):
    if db.query(Coupon).count() > 0:
        return
    now = datetime.now(timezone.utc)
    coupons = [
        Coupon(
            code="FIRST10",
            discount_type="percent",
            discount_value=10,
            expiry_type="count",
            max_uses=100,
            used_count=0,
            valid_from=now,
            min_order_value=0,
            is_active=True,
        ),
        Coupon(
            code="COLLECTOR25",
            discount_type="percent",
            discount_value=25,
            expiry_type="time",
            valid_from=now,
            valid_until=now + timedelta(days=30),
            min_order_value=200,
            is_active=True,
        ),
        Coupon(
            code="FLAT50",
            discount_type="flat",
            discount_value=50,
            expiry_type="time",
            valid_from=now,
            valid_until=now + timedelta(days=14),
            min_order_value=250,
            is_active=True,
        ),
    ]
    for c in coupons:
        db.add(c)
    db.commit()
    log.info("Seeded %d coupons", len(coupons))


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_products(db)
        seed_coupons(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
