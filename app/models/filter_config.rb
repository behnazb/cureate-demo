# FilterConfig — equivalent of lib/filterConfig.ts.
# Drives the filter dropdowns, category pills, and advanced filter panel on /products.
module FilterConfig
  module_function

  QUICK = [
    {
      id: "location",
      label: "Location",
      control: "dropdown",
      selection: "multiple",
      default_label: "All Locations",
      options: [
        { id: "all-locations", label: "All Locations" },
        { id: "washington-dc", label: "Washington, D.C." },
        { id: "maryland", label: "Maryland" },
        { id: "virginia", label: "Virginia" },
      ],
    },
    {
      id: "vendorAttributes",
      label: "Vendor Attributes",
      control: "dropdown",
      selection: "multiple",
      default_label: "All Vendor Types",
      options: [
        { id: "woman-owned",    label: "Woman-Owned" },
        { id: "minority-owned", label: "Minority-Owned" },
        { id: "local",          label: "Locally Sourced" },
        { id: "small-batch",    label: "Small Batch" },
        { id: "sustainable",    label: "Sustainable" },
      ],
    },
    {
      id: "vendor",
      label: "Vendor",
      control: "dropdown",
      selection: "multiple",
      default_label: "All Vendors",
      options: [], # populated from Vendor.all by the controller
    },
    {
      id: "dietary",
      label: "Dietary",
      control: "dropdown",
      selection: "multiple",
      default_label: "All Dietary Needs",
      options: [
        { id: "gluten-free", label: "Gluten-Free" },
        { id: "dairy-free",  label: "Dairy-Free" },
        { id: "vegan",       label: "Vegan" },
        { id: "vegetarian",  label: "Vegetarian" },
        { id: "nut-free",    label: "Nut-Free" },
      ],
    },
  ].freeze

  CATEGORY_PILLS = [
    { id: "all-products",    label: "All Products" },
    { id: "beverages",       label: "Beverages" },
    { id: "breads-bakery",   label: "Breads & Bakery" },
    { id: "catering",        label: "Catering" },
    { id: "dairy-eggs",      label: "Dairy & Eggs" },
    { id: "desserts",        label: "Desserts" },
    { id: "dry-goods",       label: "Dry Goods" },
    { id: "prepared-foods",  label: "Prepared Foods" },
    { id: "produce",         label: "Produce" },
    { id: "protein",         label: "Protein" },
    { id: "snacks",          label: "Snacks" },
    { id: "wellness-gifts",  label: "Wellness & Gifts" },
  ].freeze

  ADVANCED = [
    {
      id: "storageRequirements", label: "Storage Requirements", section: "Operations",
      control: "checkbox-group", collapsed_by_default: false,
      options: [
        { id: "dry-ambient", label: "Dry / Ambient" },
        { id: "cold",        label: "Cold" },
        { id: "frozen",      label: "Frozen" },
        { id: "warm",        label: "Warm" },
      ],
    },
    {
      id: "allergens", label: "Allergens", section: "Dietary & Ingredients",
      control: "checkbox-group", collapsed_by_default: false,
      options: [
        { id: "casein-free",   label: "Casein-Free" },
        { id: "dairy-free",    label: "Dairy-Free" },
        { id: "egg-free",      label: "Egg-Free" },
        { id: "gluten-free",   label: "Gluten-Free" },
        { id: "peanut-free",   label: "Peanut-Free" },
        { id: "seafood-free",  label: "Seafood-Free" },
        { id: "sesame-free",   label: "Sesame-Free" },
        { id: "soy-free",      label: "Soy-Free" },
        { id: "tree-nut-free", label: "Tree Nut-Free" },
      ],
    },
    {
      id: "dietaryPreferences", label: "Dietary Preferences", section: "Dietary & Ingredients",
      control: "checkbox-group", collapsed_by_default: false,
      options: [
        { id: "grass-fed",     label: "Grass-Fed / Responsibly Raised" },
        { id: "halal",         label: "Halal" },
        { id: "high-protein",  label: "High-Protein" },
        { id: "keto-friendly", label: "Keto-Friendly" },
        { id: "kosher",        label: "Kosher" },
        { id: "low-carb",      label: "Low-Carb" },
        { id: "low-fat",       label: "Low-Fat" },
        { id: "low-sodium",    label: "Low-Sodium" },
        { id: "low-sugar",     label: "Low-Sugar" },
        { id: "organic",       label: "Organic / Naturally Grown" },
        { id: "paleo",         label: "Paleo" },
        { id: "vegan",         label: "Vegan" },
        { id: "vegetarian",    label: "Vegetarian" },
      ],
    },
    {
      id: "cuisines", label: "Cuisines", section: "Discovery",
      control: "checkbox-group", collapsed_by_default: true,
      options: %w[african american asian barbecue chinese filipino french greek
                  indian italian japanese korean latin-american mediterranean
                  mexican middle-eastern other southern thai vietnamese].map { |id|
        label = case id
                when "latin-american" then "Latin American"
                when "middle-eastern" then "Middle Eastern"
                else id.split("-").map(&:capitalize).join(" ")
                end
        { id: id, label: label }
      },
    },
    {
      id: "state", label: "State", section: "Location",
      control: "checkbox-group", collapsed_by_default: true,
      options: [
        { id: "dc", label: "DC" },
        { id: "md", label: "MD" },
        { id: "va", label: "VA" },
      ],
    },
    {
      id: "priceRange", label: "Price Range (per unit)", section: "Operations",
      control: "range", collapsed_by_default: false,
      min: 0, max: 50, step: 0.5, default_min: 0, default_max: 50, options: [],
    },
  ].freeze

  def quick_with_vendors(vendors)
    QUICK.map { |f|
      if f[:id] == "vendor"
        f.merge(options: [{ id: "all-vendors", label: "All Vendors" }, *vendors.map { |v| { id: v.id, label: v.name } }])
      else
        f
      end
    }
  end

  def category_pills
    CATEGORY_PILLS
  end

  def advanced
    ADVANCED
  end

  # Group advanced filters by section heading
  def advanced_by_section
    ADVANCED.group_by { |f| f[:section] || "Other" }
  end

  # Map a category-pill id to a product Category string
  CATEGORY_PILL_MAP = {
    "beverages"      => "Beverages",
    "breads-bakery"  => "Breads & Bakery",
    "catering"       => "Catering",
    "dairy-eggs"     => "Dairy & Eggs",
    "desserts"       => "Desserts",
    "dry-goods"      => "Dry Goods",
    "prepared-foods" => "Prepared Foods",
    "produce"        => "Produce",
    "protein"        => "Protein",
    "snacks"         => "Snacks",
    "wellness-gifts" => "Wellness & Gifts",
  }.freeze
end
