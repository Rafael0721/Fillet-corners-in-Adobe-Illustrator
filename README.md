# Fillet-corners-in-Adobe-Illustrator
making different type of fillet with JavaScript in Adobe Illustrator

Including the following steps: 
1. Extracting points data from the pathItems/compoundItems.
2. Recording each path/compoundPath data with the same order as the extracted points. (For final merge)
3. Finding the right position(center point) to add circles based on each corner.
   >>Finding the bisector line first
   >>Then using similar triangles to check coordinates of center points.
   
   
4. (Optional) Checking the vector of each corner by Cross product(Vector product).
   >> https://en.wikipedia.org/wiki/Cross_product
   
5. Generating circles & group with recorded path/compoundPath data.
6. ExecuteMenuCommand() for each group.
