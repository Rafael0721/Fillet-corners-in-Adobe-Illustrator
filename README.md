# Fillet-corners-in-Adobe-Illustrator
making different type of fillet with JavaScript in Adobe Illustrator

Including the following steps: 
1. Extracting points data from the pathItems/compoundItems.
2. Recording each path/compoundPath data with the same order as the extracted points. (For final merge)
3. Finding the right position(center point) to add circles based on each corner.

   >>Finding the bisector line first
   
   >>Then using similar triangles to check coordinates of center points.
   
   ![sketch4](https://user-images.githubusercontent.com/14371547/82036939-7221a300-96dc-11ea-9d0c-741f76c10601.jpg)
   AB:AC = BD:DC
   
   ![sketch1](https://user-images.githubusercontent.com/14371547/82037008-89f92700-96dc-11ea-9955-eba8136153cf.jpg)
   Get the coordinate of point D(x, y)
   
   ![sketch2](https://user-images.githubusercontent.com/14371547/82037043-98474300-96dc-11ea-976c-5f90d9d1a543.jpg)
   AO(radius of fillet):AD = OG:DH = AG:AH
   Get the coordinate of point O(x, y) -> the center point
   
4. (Optional) Checking the vector of each corner by Cross product(+ or -). 
   >> https://en.wikipedia.org/wiki/Cross_product
   
5. Generating circles & group with recorded path/compoundPath data.
6. ExecuteMenuCommand() for each group.
   