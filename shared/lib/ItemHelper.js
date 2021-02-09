
var itembasetypes = require('../../shared/worlddata/itembasetypes.json')


module.exports =  class ItemHelper   {

 constructor()
 {

 }

 static getItemTypeByInternalName(internalname)
 {
   return itembasetypes[internalname] ;
 }

 static allowedToSellItem( item )
 {
   return !item.escrowedForMarketOrder

 }

 static async spawnNewItem(mongoInterface, newItemData)
 {
   if( mongoInterface && newItemData.containerId && newItemData.internalName && newItemData.stackQuantity && newItemData.stackQuantity > 0  )
   {
     newItemData.escrowedForMarketOrder = null;

     let newItem = await mongoInterface.insertOne('items',  newItemData   )
     return newItem
   }else{
     console.log('WARN: could not spawn item ', newItemData)
   }
   return null


 }

 static async  getContainerFromPlayerAndUnitOwner(publicAddress, containerOwnerIdRaw, mongoInterface)
 {
   if(containerOwnerIdRaw == null){
     console.log('WARN: Cannot get container with null containerOwnerId')
     return null
   }

   console.log('getContainerFromPlayerAndUnitOwner',containerOwnerIdRaw)
   let containerOwnerUnit = await mongoInterface.findById('units', containerOwnerIdRaw)

   if(containerOwnerUnit)
   {
     let containerOwnerId = containerOwnerUnit._id;

     let existingcontainer = await mongoInterface.findOne('itemContainer', {ownerAddress: publicAddress, encapsulatingUnitId:containerOwnerId  } )

     if(!existingcontainer)
     {
           await mongoInterface.insertOne('itemContainer', {ownerAddress: publicAddress, encapsulatingUnitId:containerOwnerId  } )
         existingcontainer = await mongoInterface.findOne('itemContainer', {ownerAddress: publicAddress, encapsulatingUnitId:containerOwnerId  })

     }

     return existingcontainer;
   }else{
     console.log('WARN: could not find container for player ', publicAddress)
     return null
   }

 }


}
