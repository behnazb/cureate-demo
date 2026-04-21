export const filterConfig = {
  quick: [
    {
      id: "location",
      label: "Location",
      control: "dropdown",
      selection: "multiple",
      defaultLabel: "All Locations",
      options: [
        { id: "all-locations", label: "All Locations" },
        { id: "washington-dc", label: "Washington, D.C." },
        { id: "maryland", label: "Maryland" },
        { id: "virginia", label: "Virginia" }
      ]
    },
    {
      id: "vendorAttributes",
      label: "Vendor Attributes",
      control: "dropdown",
      selection: "multiple",
      defaultLabel: "All Vendor Types",
      options: [
        { id: "woman-owned", label: "Woman-Owned" },
        { id: "minority-owned", label: "Minority-Owned" },
        { id: "local", label: "Locally Sourced" },
        { id: "small-batch", label: "Small Batch" },
        { id: "sustainable", label: "Sustainable" }
      ]
    },
    {
      id: "vendor",
      label: "Vendor",
      control: "dropdown",
      selection: "multiple",
      defaultLabel: "All Vendors",
      options: [] // populated dynamically from vendors array
    },
    {
      id: "dietary",
      label: "Dietary",
      control: "dropdown",
      selection: "multiple",
      defaultLabel: "All Dietary Needs",
      options: [
        { id: "gluten-free", label: "Gluten-Free" },
        { id: "dairy-free", label: "Dairy-Free" },
        { id: "vegan", label: "Vegan" },
        { id: "vegetarian", label: "Vegetarian" },
        { id: "nut-free", label: "Nut-Free" }
      ]
    }
  ],
  categoryPills: [
    { id: "all-products", label: "All Products" },
    { id: "beverages", label: "Beverages" },
    { id: "breads-bakery", label: "Breads & Bakery" },
    { id: "catering", label: "Catering" },
    { id: "dairy-eggs", label: "Dairy & Eggs" },
    { id: "desserts", label: "Desserts" },
    { id: "dry-goods", label: "Dry Goods" },
    { id: "prepared-foods", label: "Prepared Foods" },
    { id: "produce", label: "Produce" },
    { id: "protein", label: "Protein" },
    { id: "snacks", label: "Snacks" },
    { id: "wellness-gifts", label: "Wellness & Gifts" }
  ],
  advanced: [
    {
      id: "storageRequirements",
      label: "Storage Requirements",
      section: "Operations",
      control: "checkbox-group",
      collapsedByDefault: false,
      options: [
        { id: "dry-ambient", label: "Dry / Ambient" },
        { id: "cold", label: "Cold" },
        { id: "frozen", label: "Frozen" },
        { id: "warm", label: "Warm" }
      ]
    },
    {
      id: "allergens",
      label: "Allergens",
      section: "Dietary & Ingredients",
      control: "checkbox-group",
      collapsedByDefault: false,
      options: [
        { id: "casein-free", label: "Casein-Free" },
        { id: "dairy-free", label: "Dairy-Free" },
        { id: "egg-free", label: "Egg-Free" },
        { id: "gluten-free", label: "Gluten-Free" },
        { id: "peanut-free", label: "Peanut-Free" },
        { id: "seafood-free", label: "Seafood-Free" },
        { id: "sesame-free", label: "Sesame-Free" },
        { id: "soy-free", label: "Soy-Free" },
        { id: "tree-nut-free", label: "Tree Nut-Free" }
      ]
    },
    {
      id: "dietaryPreferences",
      label: "Dietary Preferences",
      section: "Dietary & Ingredients",
      control: "checkbox-group",
      collapsedByDefault: false,
      options: [
        { id: "grass-fed", label: "Grass-Fed / Responsibly Raised" },
        { id: "halal", label: "Halal" },
        { id: "high-protein", label: "High-Protein" },
        { id: "keto-friendly", label: "Keto-Friendly" },
        { id: "kosher", label: "Kosher" },
        { id: "low-carb", label: "Low-Carb" },
        { id: "low-fat", label: "Low-Fat" },
        { id: "low-sodium", label: "Low-Sodium" },
        { id: "low-sugar", label: "Low-Sugar" },
        { id: "organic", label: "Organic / Naturally Grown" },
        { id: "paleo", label: "Paleo" },
        { id: "vegan", label: "Vegan" },
        { id: "vegetarian", label: "Vegetarian" }
      ]
    },
    {
      id: "cuisines",
      label: "Cuisines",
      section: "Discovery",
      control: "checkbox-group",
      collapsedByDefault: true,
      options: [
        { id: "african", label: "African" },
        { id: "american", label: "American" },
        { id: "asian", label: "Asian" },
        { id: "barbecue", label: "Barbecue" },
        { id: "chinese", label: "Chinese" },
        { id: "filipino", label: "Filipino" },
        { id: "french", label: "French" },
        { id: "greek", label: "Greek" },
        { id: "indian", label: "Indian" },
        { id: "italian", label: "Italian" },
        { id: "japanese", label: "Japanese" },
        { id: "korean", label: "Korean" },
        { id: "latin-american", label: "Latin American" },
        { id: "mediterranean", label: "Mediterranean" },
        { id: "mexican", label: "Mexican" },
        { id: "middle-eastern", label: "Middle Eastern" },
        { id: "other", label: "Other" },
        { id: "southern", label: "Southern" },
        { id: "thai", label: "Thai" },
        { id: "vietnamese", label: "Vietnamese" }
      ]
    },
    {
      id: "state",
      label: "State",
      section: "Location",
      control: "checkbox-group",
      collapsedByDefault: true,
      options: [
        { id: "dc", label: "DC" },
        { id: "md", label: "MD" },
        { id: "va", label: "VA" }
      ]
    },
    {
      id: "priceRange",
      label: "Price Range (per unit)",
      section: "Operations",
      control: "range",
      collapsedByDefault: false,
      min: 0,
      max: 50,
      step: 0.5,
      defaultMin: 0,
      defaultMax: 50,
      options: []
    }
  ]
}
