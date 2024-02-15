import { v2  as cloudinary} from "cloudinary";
import fs from "fs"
      
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECERET 
});


const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        console.log("File is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteOnCloudinary = async(url)=>{
   try {
    const public_id = url.split("/").slice(-1)[0].split(".")[0];
    await cloudinary.uploader.destroy(public_id)
    console.log("file removed from cloudinary");
   } catch (error) {
     console.log("There was an error in finding the url")
   }
}

export  {uploadOnCloudinary, deleteOnCloudinary}