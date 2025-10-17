# Meal Week Planner Database Initialization Script
# This script seeds the database with example data for all entities

param(
    [string]$ApiBaseUrl = "http://localhost:4200",
    [switch]$Verbose = $false
)

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [string]$ContentType = "application/json"
    )
    
    try {
        $headers = @{
            "Content-Type" = $ContentType
            "Accept" = "application/json"
        }
        
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        
        if ($Verbose) {
            Write-Host "[SUCCESS] $Method $Uri" -ForegroundColor Green
        }
        
        return $response
    }
    catch {
        Write-Host "[ERROR] Error calling $Method $Uri" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Function to wait for API to be ready
function Wait-ForApi {
    param([string]$BaseUrl)
    
    Write-Host "Waiting for API to be ready..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    
    do {
        try {
            $response = Invoke-RestMethod -Uri "$BaseUrl/api/recipes" -Method Get -UseBasicParsing -TimeoutSec 5
            Write-Host "[SUCCESS] API is ready!" -ForegroundColor Green
            return $true
        }
        catch {
            $attempt++
            if ($attempt -lt $maxAttempts) {
                Start-Sleep -Seconds 2
                Write-Host "." -NoNewline
            }
        }
    } while ($attempt -lt $maxAttempts)
    
    Write-Host "[ERROR] API not ready after $maxAttempts attempts" -ForegroundColor Red
    return $false
}

# Main execution
Write-Host "Meal Week Planner Database Initialization" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Wait for API to be ready
if (-not (Wait-ForApi -BaseUrl $ApiBaseUrl)) {
    exit 1
}

Write-Host "`nCreating Cookbooks..." -ForegroundColor Yellow

# Create 5 cookbooks
$cookbooks = @(
    @{
        title = "Nederlandse Keuken Klassiekers"
        author = "Janny van der Heijden"
    },
    @{
        title = "Mediterrane Gezondheid"
        author = "Jamie Oliver"
    },
    @{
        title = "Aziatische Fusion"
        author = "Ken Hom"
    },
    @{
        title = "Vegetarische Delicatessen"
        author = "Yotam Ottolenghi"
    },
    @{
        title = "Snelle Weekdag Maaltijden"
        author = "Nigella Lawson"
    }
)

$createdCookbooks = @()
foreach ($cookbook in $cookbooks) {
    $response = Invoke-ApiRequest -Method "POST" -Uri "$ApiBaseUrl/api/cookbooks" -Body $cookbook
    $createdCookbooks += $response
    Write-Host "[SUCCESS] Created cookbook: $($cookbook.title)" -ForegroundColor Green
}

Write-Host "`nCreating Recipes..." -ForegroundColor Yellow

# Define meal types
$mealTypes = @("Breakfast", "Lunch", "Dinner")

# Create 5 recipes for each meal type (20 total)
$recipes = @()

# BREAKFAST RECIPES
$recipes += @{
    Title = "Hollandse Wentelteefjes"
    Description = "Klassieke Nederlandse wentelteefjes met kaneel en suiker, perfect voor een heerlijk ontbijt."
    Tags = @("ontbijt", "zoet", "klassiek", "nederlands")
    CookbookId = $createdCookbooks[0].id
    Page = 15
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Wit brood"; type = "graan"; amount = @{ value = 8; unit = "plakjes" } },
        @{ name = "Eieren"; type = "eiwit"; amount = @{ value = 4; unit = "stuks" } },
        @{ name = "Melk"; type = "zuivel"; amount = @{ value = 200; unit = "ml" } },
        @{ name = "Kaneel"; type = "kruiderij"; amount = @{ value = 2; unit = "theelepels" } },
        @{ name = "Suiker"; type = "zoetstof"; amount = @{ value = 3; unit = "eetlepels" } },
        @{ name = "Boter"; type = "zuivel"; amount = @{ value = 50; unit = "gram" } }
    )
    Recipe = @(
        "Meng eieren, melk, kaneel en 1 eetlepel suiker in een diepe schaal.",
        "Dip elke plak brood aan beide kanten in het eimengsel.",
        "Verhit boter in een koekenpan op middelhoog vuur.",
        "Bak de wentelteefjes 2-3 minuten per kant tot goudbruin.",
        "Bestrooi met de resterende suiker en serveer warm."
    )
}

$recipes += @{
    Title = "Griekse Yoghurt Bowl"
    Description = "Gezonde yoghurt bowl met verse bessen, granola en honing."
    Tags = @("gezond", "eiwitrijk", "fruit", "mediterraan")
    CookbookId = $createdCookbooks[1].id
    Page = 42
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Griekse yoghurt"; type = "zuivel"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Verse bessen"; type = "fruit"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Granola"; type = "graan"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Honing"; type = "zoetstof"; amount = @{ value = 2; unit = "eetlepels" } },
        @{ name = "Amandelen"; type = "noten"; amount = @{ value = 20; unit = "gram" } }
    )
    Recipe = @(
        "Schep de yoghurt in een kom.",
        "Was de bessen en verdeel over de yoghurt.",
        "Voeg de granola toe.",
        "Bestrooi met amandelen.",
        "Drizzle honing over de bowl en serveer."
    )
}

$recipes += @{
    Title = "Japanse Okonomiyaki"
    Description = "Japanse pannenkoek met kool en zeevruchten, perfect voor een hartig ontbijt."
    Tags = @("japans", "hartig", "kool", "zeevruchten")
    CookbookId = $createdCookbooks[2].id
    Page = 78
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Witte kool"; type = "groente"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Zelfrijzend bakmeel"; type = "graan"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Eieren"; type = "eiwit"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Garnalen"; type = "zeevruchten"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Lente-ui"; type = "groente"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Okonomiyaki saus"; type = "saus"; amount = @{ value = 3; unit = "eetlepels" } },
        @{ name = "Mayonaise"; type = "saus"; amount = @{ value = 2; unit = "eetlepels" } }
    )
    Recipe = @(
        "Snijd de kool en lente-ui fijn.",
        "Meng kool, meel, eieren en een beetje water tot een beslag.",
        "Voeg de garnalen toe aan het beslag.",
        "Verhit olie in een koekenpan en giet het beslag erin.",
        "Bak 5-6 minuten per kant op middelhoog vuur.",
        "Serveer met okonomiyaki saus en mayonaise."
    )
}

$recipes += @{
    Title = "Avocado Toast Deluxe"
    Description = "Moderne avocado toast met cherry tomaatjes en feta."
    Tags = @("gezond", "vegetarisch", "avocado", "modern")
    CookbookId = $createdCookbooks[3].id
    Page = 23
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Volkoren brood"; type = "graan"; amount = @{ value = 2; unit = "plakjes" } },
        @{ name = "Rijpe avocado"; type = "fruit"; amount = @{ value = 1; unit = "stuk" } },
        @{ name = "Cherry tomaatjes"; type = "groente"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Feta kaas"; type = "zuivel"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Limoensap"; type = "fruit"; amount = @{ value = 1; unit = "theelepel" } },
        @{ name = "Zwarte peper"; type = "kruiderij"; amount = @{ value = 1; unit = "snufje" } },
        @{ name = "Zeezout"; type = "kruiderij"; amount = @{ value = 1; unit = "snufje" } }
    )
    Recipe = @(
        "Rooster de boterhammen.",
        "Prak de avocado fijn met limoensap, zout en peper.",
        "Halveer de cherry tomaatjes.",
        "Besmeer de toast met avocado.",
        "Verdeel de tomaatjes en verkruimelde feta erover.",
        "Serveer direct."
    )
}

$recipes += @{
    Title = "Engelse Breakfast Muffins"
    Description = "Snelle en voedzame ontbijtmuffins met ei en spek."
    Tags = @("hartig", "eiwitrijk", "snel", "engels")
    CookbookId = $createdCookbooks[4].id
    Page = 67
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Engelse muffins"; type = "graan"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Eieren"; type = "eiwit"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Spek"; type = "vlees"; amount = @{ value = 4; unit = "plakjes" } },
        @{ name = "Cheddar kaas"; type = "zuivel"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Boter"; type = "zuivel"; amount = @{ value = 2; unit = "eetlepels" } }
    )
    Recipe = @(
        "Bak het spek krokant in een koekenpan.",
        "Bak de eieren als spiegeleieren.",
        "Rooster de muffins en besmeer met boter.",
        "Leg spek en ei op de muffins.",
        "Bedek met geraspte cheddar.",
        "Serveer warm."
    )
}

# LUNCH RECIPES
$recipes += @{
    Title = "Hollandse Erwtensoep"
    Description = "Dikke, hartige erwtensoep met rookworst, typisch Nederlands wintergerecht."
    Tags = @("soep", "winter", "hollands", "hartig")
    CookbookId = $createdCookbooks[0].id
    Page = 89
    MealTypes = @("Lunch")
    Ingredients = @(
        @{ name = "Gedroogde spliterwten"; type = "peulvrucht"; amount = @{ value = 250; unit = "gram" } },
        @{ name = "Rookworst"; type = "vlees"; amount = @{ value = 1; unit = "stuk" } },
        @{ name = "Uien"; type = "groente"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Wortelen"; type = "groente"; amount = @{ value = 3; unit = "stuks" } },
        @{ name = "Selderij"; type = "groente"; amount = @{ value = 2; unit = "stengels" } },
        @{ name = "Vleesbouillon"; type = "bouillon"; amount = @{ value = 1; unit = "liter" } },
        @{ name = "Laurierblad"; type = "kruid"; amount = @{ value = 2; unit = "stuks" } }
    )
    Recipe = @(
        "Week de erwtjes 8 uur in water.",
        "Fruit de gesneden uien aan.",
        "Voeg erwtjes, groenten en bouillon toe.",
        "Laat 1,5 uur zachtjes koken.",
        "Voeg rookworst toe en kook nog 15 minuten.",
        "Serveer met roggebrood."
    )
}

$recipes += @{
    Title = "Mediterrane Quinoa Salade"
    Description = "Lichte en voedzame quinoa salade met feta en olijven."
    Tags = @("gezond", "quinoa", "mediterraan", "vegetarisch")
    CookbookId = $createdCookbooks[1].id
    Page = 134
    MealTypes = @("Lunch")
    Ingredients = @(
        @{ name = "Quinoa"; type = "graan"; amount = @{ value = 150; unit = "gram" } },
        @{ name = "Cherry tomaatjes"; type = "groente"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Komkommer"; type = "groente"; amount = @{ value = 1; unit = "stuk" } },
        @{ name = "Feta kaas"; type = "zuivel"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Zwarte olijven"; type = "groente"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Olijfolie"; type = "olie"; amount = @{ value = 3; unit = "eetlepels" } },
        @{ name = "Citroensap"; type = "fruit"; amount = @{ value = 2; unit = "eetlepels" } }
    )
    Recipe = @(
        "Kook de quinoa volgens de verpakking.",
        "Laat afkoelen.",
        "Snijd alle groenten in kleine stukjes.",
        "Meng quinoa met groenten en olijven.",
        "Maak een dressing van olijfolie en citroensap.",
        "Voeg feta toe en serveer."
    )
}

$recipes += @{
    Title = "Thaise Pad Thai"
    Description = "Klassieke Thaise noedels met garnalen en pinda's."
    Tags = @("thais", "noedels", "garnalen", "pittig")
    CookbookId = $createdCookbooks[2].id
    Page = 156
    MealTypes = @("Lunch")
    Ingredients = @(
        @{ name = "Rijstnoedels"; type = "graan"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Garnalen"; type = "zeevruchten"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Taugé"; type = "groente"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Lente-ui"; type = "groente"; amount = @{ value = 3; unit = "stuks" } },
        @{ name = "Eieren"; type = "eiwit"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Pinda's"; type = "noten"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Pad Thai saus"; type = "saus"; amount = @{ value = 4; unit = "eetlepels" } }
    )
    Recipe = @(
        "Week de noedels 10 minuten in warm water.",
        "Bak de garnalen kort aan.",
        "Klop de eieren en bak als roerei.",
        "Roerbak noedels met saus.",
        "Voeg garnalen, ei en groenten toe.",
        "Garneer met pinda's en serveer."
    )
}

$recipes += @{
    Title = "Vegetarische Buddha Bowl"
    Description = "Kleurrijke bowl met geroosterde groenten en hummus."
    Tags = @("vegetarisch", "gezond", "bowl", "gekleurd")
    CookbookId = $createdCookbooks[3].id
    Page = 98
    MealTypes = @("Lunch")
    Ingredients = @(
        @{ name = "Zoete aardappel"; type = "groente"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Broccoli"; type = "groente"; amount = @{ value = 1; unit = "kop" } },
        @{ name = "Kikkererwten"; type = "peulvrucht"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Avocado"; type = "fruit"; amount = @{ value = 1; unit = "stuk" } },
        @{ name = "Hummus"; type = "dip"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Pompoenpitten"; type = "zaad"; amount = @{ value = 2; unit = "eetlepels" } },
        @{ name = "Tahini"; type = "saus"; amount = @{ value = 2; unit = "eetlepels" } }
    )
    Recipe = @(
        "Rooster zoete aardappel en broccoli in de oven.",
        "Kook de kikkererwten.",
        "Snijd de avocado.",
        "Rangschik alles in een kom.",
        "Voeg hummus en tahini toe.",
        "Bestrooi met pompoenpitten."
    )
}

$recipes += @{
    Title = "Snelle Caesar Wrap"
    Description = "Hartige wrap met kip, sla en caesar dressing."
    Tags = @("snel", "kip", "wrap", "hartig")
    CookbookId = $createdCookbooks[4].id
    Page = 145
    MealTypes = @("Lunch")
    Ingredients = @(
        @{ name = "Tortilla wraps"; type = "graan"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Kipfilet"; type = "vlees"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Romesco sla"; type = "groente"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Parmezaanse kaas"; type = "zuivel"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Croutons"; type = "graan"; amount = @{ value = 30; unit = "gram" } },
        @{ name = "Caesar dressing"; type = "saus"; amount = @{ value = 4; unit = "eetlepels" } }
    )
    Recipe = @(
        "Grill de kip en snijd in reepjes.",
        "Warm de wraps kort op.",
        "Besmeer met caesar dressing.",
        "Voeg sla, kip en croutons toe.",
        "Strooi parmezaan erover.",
        "Rol op en serveer."
    )
}

# DINNER RECIPES
$recipes += @{
    Title = "Stamppot Boerenkool"
    Description = "Traditionele Nederlandse stamppot met boerenkool en rookworst."
    Tags = @("nederlands", "winter", "stamppot", "rookworst")
    CookbookId = $createdCookbooks[0].id
    Page = 67
    MealTypes = @("Dinner")
    Ingredients = @(
        @{ name = "Kruimige aardappelen"; type = "groente"; amount = @{ value = 1; unit = "kg" } },
        @{ name = "Boerenkool"; type = "groente"; amount = @{ value = 500; unit = "gram" } },
        @{ name = "Rookworst"; type = "vlees"; amount = @{ value = 1; unit = "stuk" } },
        @{ name = "Melk"; type = "zuivel"; amount = @{ value = 100; unit = "ml" } },
        @{ name = "Boter"; type = "zuivel"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Mosterd"; type = "kruiderij"; amount = @{ value = 2; unit = "eetlepels" } }
    )
    Recipe = @(
        "Schil en kook de aardappelen.",
        "Kook de boerenkool mee met de aardappelen.",
        "Giet af en stamp alles samen.",
        "Voeg melk, boter en mosterd toe.",
        "Kook de rookworst apart.",
        "Serveer met mosterd en jus."
    )
}

$recipes += @{
    Title = "Griekse Moussaka"
    Description = "Hartige ovenschotel met aubergine, gehakt en bechamelsaus."
    Tags = @("grieks", "ovenschotel", "aubergine", "gehakt")
    CookbookId = $createdCookbooks[1].id
    Page = 178
    MealTypes = @("Dinner")
    Ingredients = @(
        @{ name = "Aubergines"; type = "groente"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Gehakt"; type = "vlees"; amount = @{ value = 500; unit = "gram" } },
        @{ name = "Tomaten"; type = "groente"; amount = @{ value = 400; unit = "gram" } },
        @{ name = "Uien"; type = "groente"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Knoflook"; type = "groente"; amount = @{ value = 3; unit = "teentjes" } },
        @{ name = "Kaas"; type = "zuivel"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Melk"; type = "zuivel"; amount = @{ value = 300; unit = "ml" } }
    )
    Recipe = @(
        "Snijd aubergines en bak goudbruin.",
        "Fruit uien en knoflook aan.",
        "Voeg gehakt en tomaten toe.",
        "Maak bechamelsaus met melk en kaas.",
        "Laag aubergine, gehakt en saus in ovenschaal.",
        "Bak 45 minuten op 180°C."
    )
}

$recipes += @{
    Title = "Japanse Teriyaki Zalm"
    Description = "Malse zalm met zoete teriyaki saus en gestoomde rijst."
    Tags = @("japans", "zalm", "teriyaki", "rijst")
    CookbookId = $createdCookbooks[2].id
    Page = 203
    MealTypes = @("Dinner")
    Ingredients = @(
        @{ name = "Zalmfilet"; type = "vis"; amount = @{ value = 400; unit = "gram" } },
        @{ name = "Sushi rijst"; type = "graan"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Sojasaus"; type = "saus"; amount = @{ value = 4; unit = "eetlepels" } },
        @{ name = "Mirin"; type = "saus"; amount = @{ value = 2; unit = "eetlepels" } },
        @{ name = "Suiker"; type = "zoetstof"; amount = @{ value = 2; unit = "eetlepels" } },
        @{ name = "Sesamzaadjes"; type = "zaad"; amount = @{ value = 1; unit = "eetlepel" } },
        @{ name = "Lente-ui"; type = "groente"; amount = @{ value = 2; unit = "stuks" } }
    )
    Recipe = @(
        "Kook de rijst volgens de verpakking.",
        "Meng sojasaus, mirin en suiker voor teriyaki saus.",
        "Bak de zalm aan beide kanten.",
        "Voeg teriyaki saus toe en laat karamelliseren.",
        "Serveer over rijst.",
        "Garneer met sesamzaadjes en lente-ui."
    )
}

$recipes += @{
    Title = "Vegetarische Lasagne"
    Description = "Hartige lasagne met spinazie, ricotta en tomatensaus."
    Tags = @("vegetarisch", "italiaans", "lasagne", "spinazie")
    CookbookId = $createdCookbooks[3].id
    Page = 167
    MealTypes = @("Dinner")
    Ingredients = @(
        @{ name = "Lasagne vellen"; type = "graan"; amount = @{ value = 12; unit = "stuks" } },
        @{ name = "Spinazie"; type = "groente"; amount = @{ value = 300; unit = "gram" } },
        @{ name = "Ricotta kaas"; type = "zuivel"; amount = @{ value = 250; unit = "gram" } },
        @{ name = "Mozzarella"; type = "zuivel"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Tomaten saus"; type = "saus"; amount = @{ value = 500; unit = "ml" } },
        @{ name = "Parmezaanse kaas"; type = "zuivel"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Knoflook"; type = "groente"; amount = @{ value = 2; unit = "teentjes" } }
    )
    Recipe = @(
        "Blancheer de spinazie en knijp overtollig vocht uit.",
        "Meng spinazie met ricotta en knoflook.",
        "Maak lagen van saus, vellen, spinaziemengsel.",
        "Herhaal tot alles op is.",
        "Bedek met mozzarella en parmezaan.",
        "Bak 45 minuten op 180°C."
    )
}

$recipes += @{
    Title = "Snelle Kip Curry"
    Description = "Pittige kip curry met kokosmelk en rijst."
    Tags = @("curry", "kip", "pittig", "snel")
    CookbookId = $createdCookbooks[4].id
    Page = 89
    MealTypes = @("Dinner")
    Ingredients = @(
        @{ name = "Kipfilet"; type = "vlees"; amount = @{ value = 500; unit = "gram" } },
        @{ name = "Kokosmelk"; type = "zuivel"; amount = @{ value = 400; unit = "ml" } },
        @{ name = "Curry pasta"; type = "kruiderij"; amount = @{ value = 3; unit = "eetlepels" } },
        @{ name = "Uien"; type = "groente"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Rijst"; type = "graan"; amount = @{ value = 250; unit = "gram" } },
        @{ name = "Limoenblad"; type = "kruid"; amount = @{ value = 3; unit = "stuks" } },
        @{ name = "Bruine suiker"; type = "zoetstof"; amount = @{ value = 2; unit = "eetlepels" } }
    )
    Recipe = @(
        "Snijd kip in blokjes.",
        "Fruit uien aan met curry pasta.",
        "Voeg kip toe en bak 5 minuten.",
        "Voeg kokosmelk en limoenblad toe.",
        "Laat 15 minuten sudderen.",
        "Serveer over gekookte rijst."
    )
}

# Breakfast RECIPES
$recipes += @{
    Title = "Hollandse Bitterballen"
    Description = "Krokante bitterballen met ragout, typisch Nederlandse Breakfast."
    Tags = @("Breakfast", "krokant", "ragout", "nederlands")
    CookbookId = $createdCookbooks[0].id
    Page = 234
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Rundvlees"; type = "vlees"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Boter"; type = "zuivel"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Bloem"; type = "graan"; amount = @{ value = 50; unit = "gram" } },
        @{ name = "Vleesbouillon"; type = "bouillon"; amount = @{ value = 250; unit = "ml" } },
        @{ name = "Paneermeel"; type = "graan"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Eieren"; type = "eiwit"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Nootmuskaat"; type = "kruiderij"; amount = @{ value = 1; unit = "theelepel" } }
    )
    Recipe = @(
        "Kook het vlees gaar en hak fijn.",
        "Maak een roux van boter en bloem.",
        "Voeg bouillon toe voor ragout.",
        "Meng vlees en kruiden erdoor.",
        "Laat afkoelen en vorm balletjes.",
        "Paneeer en frituur goudbruin."
    )
}

$recipes += @{
    Title = "Mediterrane Olijven Mix"
    Description = "Gemixt assortiment olijven met kruiden en olijfolie."
    Tags = @("mediterraan", "olijven", "kruiden", "light")
    CookbookId = $createdCookbooks[1].id
    Page = 45
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Zwarte olijven"; type = "groente"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Groene olijven"; type = "groente"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Kalamata olijven"; type = "groente"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Verse tijm"; type = "kruid"; amount = @{ value = 2; unit = "takjes" } },
        @{ name = "Verse rozemarijn"; type = "kruid"; amount = @{ value = 1; unit = "takje" } },
        @{ name = "Olijfolie"; type = "olie"; amount = @{ value = 3; unit = "eetlepels" } },
        @{ name = "Citroenschil"; type = "fruit"; amount = @{ value = 1; unit = "theelepel" } }
    )
    Recipe = @(
        "Meng alle olijven in een kom.",
        "Voeg kruiden en citroenschil toe.",
        "Giet olijfolie erover.",
        "Laat 2 uur marineren.",
        "Serveer op kamertemperatuur."
    )
}

$recipes += @{
    Title = "Aziatische Spring Rolls"
    Description = "Knapperige spring rolls met groenten en zoetzure saus."
    Tags = @("aziatisch", "knapperig", "groenten", "dip")
    CookbookId = $createdCookbooks[2].id
    Page = 112
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Spring roll vellen"; type = "graan"; amount = @{ value = 12; unit = "stuks" } },
        @{ name = "Wortelen"; type = "groente"; amount = @{ value = 2; unit = "stuks" } },
        @{ name = "Komkommer"; type = "groente"; amount = @{ value = 1; unit = "stuk" } },
        @{ name = "Taugé"; type = "groente"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Munt"; type = "kruid"; amount = @{ value = 1; unit = "handje" } },
        @{ name = "Zoetzure saus"; type = "saus"; amount = @{ value = 100; unit = "ml" } },
        @{ name = "Pinda's"; type = "noten"; amount = @{ value = 50; unit = "gram" } }
    )
    Recipe = @(
        "Snijd alle groenten in julienne.",
        "Week spring roll vellen kort.",
        "Vul met groenten en munt.",
        "Rol strak op.",
        "Serveer met zoetzure saus.",
        "Bestrooi met gehakte pinda's."
    )
}

$recipes += @{
    Title = "Vegetarische Hummus Bowl"
    Description = "Cremige hummus met verse groenten en pitabrood."
    Tags = @("vegetarisch", "hummus", "gezond", "dip")
    CookbookId = $createdCookbooks[3].id
    Page = 78
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Kikkererwten"; type = "peulvrucht"; amount = @{ value = 400; unit = "gram" } },
        @{ name = "Tahini"; type = "saus"; amount = @{ value = 3; unit = "eetlepels" } },
        @{ name = "Citroensap"; type = "fruit"; amount = @{ value = 3; unit = "eetlepels" } },
        @{ name = "Knoflook"; type = "groente"; amount = @{ value = 2; unit = "teentjes" } },
        @{ name = "Komkommer"; type = "groente"; amount = @{ value = 1; unit = "stuk" } },
        @{ name = "Pitabrood"; type = "graan"; amount = @{ value = 4; unit = "stuks" } },
        @{ name = "Paprika"; type = "groente"; amount = @{ value = 1; unit = "stuk" } }
    )
    Recipe = @(
        "Pureer kikkererwten met tahini en citroensap.",
        "Voeg knoflook en zout toe.",
        "Snijd groenten in reepjes.",
        "Warm pitabrood op.",
        "Serveer hummus met groenten.",
        "Dip pitabrood in hummus."
    )
}

$recipes += @{
    Title = "Snelle Energy Balls"
    Description = "Gezonde energy balls met dadels en noten."
    Tags = @("gezond", "energy", "dadels", "noten")
    CookbookId = $createdCookbooks[4].id
    Page = 201
    MealTypes = @("Breakfast")
    Ingredients = @(
        @{ name = "Dadels"; type = "fruit"; amount = @{ value = 200; unit = "gram" } },
        @{ name = "Amandelen"; type = "noten"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Cashewnoten"; type = "noten"; amount = @{ value = 100; unit = "gram" } },
        @{ name = "Cacaopoeder"; type = "kruiderij"; amount = @{ value = 2; unit = "eetlepels" } },
        @{ name = "Vanille extract"; type = "kruiderij"; amount = @{ value = 1; unit = "theelepel" } },
        @{ name = "Zeezout"; type = "kruiderij"; amount = @{ value = 1; unit = "snufje" } },
        @{ name = "Kokosrasp"; type = "fruit"; amount = @{ value = 3; unit = "eetlepels" } }
    )
    Recipe = @(
        "Week dadels 10 minuten in warm water.",
        "Hak noten grof.",
        "Pureer dadels met cacao en vanille.",
        "Meng met noten en zout.",
        "Vorm balletjes.",
        "Rol door kokosrasp en koel."
    )
}

# Create all recipes
$createdRecipes = @()
foreach ($recipe in $recipes) {
    try {
        $response = Invoke-ApiRequest -Method "POST" -Uri "$ApiBaseUrl/api/recipes/upload" -Body $recipe        
        
        # Check if response has error property
        if ($response.PSObject.Properties.Name -contains "error") {
            Write-Host "[ERROR] API returned error: $($response.error)" -ForegroundColor Red
            continue
        }
        
        # Check if response has the expected recipe properties
        if ($response.PSObject.Properties.Name -contains "Title" -and $response.PSObject.Properties.Name -contains "MealTypes") {            
            $createdRecipes += $response
        } else {
            Write-Host "[ERROR] Response missing expected properties. Available: $($response.PSObject.Properties.Name -join ', ')" -ForegroundColor Red
            continue
        }
        
        Write-Host "[SUCCESS] Created recipe: $($recipe.Title)" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Failed to create recipe '$($recipe.Title)': $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nCreating Recipe Settings..." -ForegroundColor Yellow

# Create comprehensive recipe settings
$recipeSettings = @{
    tags = @(        
        "gezond", "vegetarisch", "veganistisch", "glutenvrij", "lactosevrij",
        "snel", "makkelijk", "klassiek", "modern", "traditioneel",
        "pittig", "zoet", "hartig", "zuur", "bitter",
        "nederlands", "italiaans", "frans", "spaans", "grieks", "aziatisch", "mediterraan",
        "winter", "zomer", "lente", "herfst",
        "eiwitrijk", "koolhydraatarm", "vetarm", "vezelrijk",
        "koud", "warm", "krokant", "zacht", "romig"
    )
    ingredients = @(
        "aardappelen", "rijst", "pasta", "brood", "quinoa", "couscous", "bulgur",
        "kip", "rundvlees", "varkensvlees", "lamsvlees", "kalkoen", "worst", "spek",
        "zalm", "kabeljauw", "tonijn", "garnalen", "mosselen", "kreeft", "krab",
        "eieren", "melk", "yoghurt", "kaas", "boter", "room", "crème fraîche",
        "tomaten", "ui", "knoflook", "wortelen", "selderij", "paprika", "komkommer",
        "spinazie", "sla", "broccoli", "bloemkool", "spruitjes", "boerenkool",
        "appels", "bananen", "sinaasappels", "citroenen", "limoenen", "bessen",
        "olijfolie", "zonnebloemolie", "kokosolie", "sesamolie",
        "zout", "peper", "kruiden", "specerijen", "basilicum", "oregano", "tijm",
        "suiker", "honing", "ahornsiroop", "vanille", "kaneel", "nootmuskaat"
    )
    units = @(
        "gram", "kilogram", "liter", "milliliter", "deciliter",
        "eetlepel", "theelepel", "kopje", "glas", "schaaltje",
        "stuks", "plakjes", "snippers", "takjes", "teentjes",
        "snufje", "beetje", "handje", "bosje", "bundel"
    )
    categories = @(
        "Voorgerecht", "Soep", "Salade", "Hoofdgerecht", "Bijgerecht",
        "Dessert", "Drank", "Saus", "Marinade", "Dressing",
        "Ontbijt", "Lunch", "Diner", "Snack", "Tussendoortje",
        "Vegetarisch", "Veganistisch", "Glutenvrij", "Lactosevrij",
        "Nederlands", "Italiaans", "Frans", "Spaans", "Grieks", "Aziatisch",
        "Mediterraan", "Mexicaans", "Indisch", "Thais", "Chinees", "Japans",
        "Snel", "Makkelijk", "Klassiek", "Modern", "Gezond", "Comfort Food"
    )
}

$recipeSettingsResponse = Invoke-ApiRequest -Method "PUT" -Uri "$ApiBaseUrl/api/recipesettings" -Body $recipeSettings
Write-Host "[SUCCESS] Created recipe settings with $($recipeSettings.tags.Count) tags, $($recipeSettings.ingredients.Count) ingredients, $($recipeSettings.units.Count) units, and $($recipeSettings.categories.Count) categories" -ForegroundColor Green

Write-Host "`nCreating Week Menu..." -ForegroundColor Yellow


# Calculate current week and upcoming 5 days starting from today
$today = Get-Date
$breakfastRecipes = $createdRecipes | Where-Object { $_.MealTypes -contains "Breakfast" }
$lunchRecipes = $createdRecipes | Where-Object { $_.MealTypes -contains "Lunch" }
$dinnerRecipes = $createdRecipes | Where-Object { $_.MealTypes -contains "Dinner" }

# Check if we have recipes for each meal type
if ($breakfastRecipes.Count -eq 0) {
    Write-Host "[WARNING] No breakfast recipes found. Skipping week menu creation." -ForegroundColor Yellow
    exit 1
}
if ($lunchRecipes.Count -eq 0) {
    Write-Host "[WARNING] No lunch recipes found. Skipping week menu creation." -ForegroundColor Yellow
    exit 1
}
if ($dinnerRecipes.Count -eq 0) {
    Write-Host "[WARNING] No dinner recipes found. Skipping week menu creation." -ForegroundColor Yellow
    exit 1
}

# Function to get week number and year for a given date
function Get-WeekInfo {
    param([DateTime]$Date)
    $weekNumber = [System.Globalization.CultureInfo]::CurrentCulture.Calendar.GetWeekOfYear($Date, [System.Globalization.CalendarWeekRule]::FirstDay, [DayOfWeek]::Monday)
    $year = $Date.Year
    return @{ WeekNumber = $weekNumber; Year = $year }
}

# Group the next 5 days by week
$weekGroups = @{}
$recipeIndex = 0

for ($i = 0; $i -lt 5; $i++) {
    $targetDate = $today.AddDays($i)
    $weekInfo = Get-WeekInfo -Date $targetDate
    $weekKey = "$($weekInfo.Year)-W$($weekInfo.WeekNumber)"
    
    if (-not $weekGroups.ContainsKey($weekKey)) {
        $weekGroups[$weekKey] = @{
            WeekNumber = $weekInfo.WeekNumber
            Year = $weekInfo.Year
            Days = @()
        }
    }
    
    $dayOfWeek = [int]$targetDate.DayOfWeek
    # Convert Sunday=0 to Sunday=7 for consistency with API expectations
    if ($dayOfWeek -eq 0) {
        $dayOfWeek = 7
    }
    
    $weekDay = @{
        dayOfWeek = $dayOfWeek
        breakfastRecipeId = $breakfastRecipes[$recipeIndex % $breakfastRecipes.Count].id
        lunchRecipeId = $lunchRecipes[$recipeIndex % $lunchRecipes.Count].id
        dinnerRecipeId = $dinnerRecipes[$recipeIndex % $dinnerRecipes.Count].id
    }
    
    $weekGroups[$weekKey].Days += $weekDay
    $recipeIndex++
}

# Create week menu entities for each week
foreach ($weekKey in $weekGroups.Keys) {
    $weekData = $weekGroups[$weekKey]
    
    $weekMenu = @{
        weekNumber = $weekData.WeekNumber
        year = $weekData.Year
        weekDays = $weekData.Days
    }
    
    $weekMenuResponse = Invoke-ApiRequest -Method "POST" -Uri "$ApiBaseUrl/api/weekmenus" -Body $weekMenu
    Write-Host "[SUCCESS] Created week menu for week $($weekData.WeekNumber), $($weekData.Year)" -ForegroundColor Green
}

Write-Host "`nCreating Grocery Lists..." -ForegroundColor Yellow

# Verify we still have recipes for each meal type (in case they were cleared)
if ($breakfastRecipes.Count -eq 0 -or $lunchRecipes.Count -eq 0 -or $dinnerRecipes.Count -eq 0) {
    Write-Host "[ERROR] Missing recipes for meal types. Cannot create grocery lists." -ForegroundColor Red
    Write-Host "Breakfast recipes: $($breakfastRecipes.Count)" -ForegroundColor Red
    Write-Host "Lunch recipes: $($lunchRecipes.Count)" -ForegroundColor Red
    Write-Host "Dinner recipes: $($dinnerRecipes.Count)" -ForegroundColor Red
    exit 1
}

# Create first grocery list for the upcoming 5 days starting from today
$groceryList1 = @{
    dayOfGrocery = $today.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    meals = @()
}

# Add meals for next 5 days starting from today
for ($i = 0; $i -lt 5; $i++) {
    $mealDate = $today.AddDays($i).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    # Add breakfast
    $groceryList1.meals += @{
        dayOfMeal = $mealDate
        mealType = "breakfast"
        recipeId = $breakfastRecipes[$i % $breakfastRecipes.Count].id
    }
    
    # Add lunch
    $groceryList1.meals += @{
        dayOfMeal = $mealDate
        mealType = "lunch"
        recipeId = $lunchRecipes[$i % $lunchRecipes.Count].id
    }
    
    # Add dinner
    $groceryList1.meals += @{
        dayOfMeal = $mealDate
        mealType = "dinner"
        recipeId = $dinnerRecipes[$i % $dinnerRecipes.Count].id
    }
}

$groceryList1Response = Invoke-ApiRequest -Method "POST" -Uri "$ApiBaseUrl/api/grocerylists" -Body $groceryList1
Write-Host "[SUCCESS] Created grocery list 1 for next 5 days" -ForegroundColor Green

# Create second grocery list for weekend (days 5-6 from today)
$groceryList2 = @{
    dayOfGrocery = $today.AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    meals = @()
}

# Add weekend meals (days 5-6 from today)
for ($i = 5; $i -le 6; $i++) {
    $mealDate = $today.AddDays($i).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    # Add breakfast
    $groceryList2.meals += @{
        dayOfMeal = $mealDate
        mealType = "breakfast"
        recipeId = $breakfastRecipes[$i % $breakfastRecipes.Count].id
    }
    
    # Add lunch
    $groceryList2.meals += @{
        dayOfMeal = $mealDate
        mealType = "lunch"
        recipeId = $lunchRecipes[$i % $lunchRecipes.Count].id
    }
    
    # Add dinner
    $groceryList2.meals += @{
        dayOfMeal = $mealDate
        mealType = "dinner"
        recipeId = $dinnerRecipes[$i % $dinnerRecipes.Count].id
    }
}

$groceryList2Response = Invoke-ApiRequest -Method "POST" -Uri "$ApiBaseUrl/api/grocerylists" -Body $groceryList2
Write-Host "[SUCCESS] Created grocery list 2 for weekend" -ForegroundColor Green

Write-Host "`nDatabase initialization completed successfully!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  • Cookbooks created: $($createdCookbooks.Count)" -ForegroundColor White
Write-Host "  • Recipes created: $($createdRecipes.Count)" -ForegroundColor White
Write-Host "  • Recipe settings created: 1" -ForegroundColor White
Write-Host "  • Week menus created: $($weekGroups.Count)" -ForegroundColor White
Write-Host "  • Grocery lists created: 2" -ForegroundColor White
Write-Host "`nYou can now access the application at: $ApiBaseUrl" -ForegroundColor Yellow
