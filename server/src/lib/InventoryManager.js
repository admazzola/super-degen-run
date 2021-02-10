
let mongoInterface = require('./mongo-interface')

const ItemHelper = require('../../../shared/lib/ItemHelper')
const WorldHelper = require('../../../shared/lib/WorldHelper')
const UnitHelper = require('../../../shared/lib/UnitHelper')

module.exports = class InventoryManager {



  constructor(mongoInterface)
  {
    this.mongoInterface = mongoInterface


  }


  async getInventoryForPlayerByAddress()
  {
    console.log('getInventoryForPlayerByAddress')
  //  var items = await this.mongoInterface.findAll()

    return []

  }


  async createItemForPlayerByAddress( spawnItemData )
  {
  //  let itemType = await ItemHelper.getItemTypeByInternalName(spawnItemData.itemInternalName)



    let player = await this.mongoInterface.findOne('activePlayers', {publicAddress: spawnItemData.playerAddress } )

    let itemContainer =  await this.getActiveItemContainerForPlayer( player )

    if(itemContainer && itemContainer._id)
    {
      let newItem = await ItemHelper.spawnNewItem(this.mongoInterface,{

        containerId: itemContainer._id,
        internalName: spawnItemData.itemInternalName,
        stackQuantity: spawnItemData.quantity

      })
      return newItem
    }

    return null
  }


  async getActiveItemContainerForPlayer( player )
  {

    let containerOwnerIdRaw = player.possessedUnitId // WorldHelper.getActiveItemContainerEncapsulatingUnitIDForPlayer(player)

    let containerOwnerUnit = await this.mongoInterface.findById('units', containerOwnerIdRaw)

    if( containerOwnerUnit )
    {
      let existingcontainer = await this.mongoInterface.findOne('itemContainer', {ownerAddress: player.publicAddress, encapsulatingUnitId: containerOwnerUnit._id  } )
      if(!existingcontainer)
      {
            await this.mongoInterface.insertOne('itemContainer', {ownerAddress: player.publicAddress, encapsulatingUnitId: containerOwnerUnit._id  } )
          existingcontainer = await this.mongoInterface.findOne('itemContainer', {ownerAddress: player.publicAddress, encapsulatingUnitId: containerOwnerUnit._id  } )

      }

      return existingcontainer

    }

    return null

  }



  async playerAddressHasAccessToContainer(publicAddress, container )
  {
    let player = await this.mongoInterface.findOne('activePlayers', {publicAddress: publicAddress } )

    if(player)
    {

      //console.log('meep has access ',publicAddress, container)
      let containerOwnerId = container.encapsulatingUnitId;


      //let containerOwnerUnit = await this.mongoInterface.findById('units', containerOwnerId)

       let containingUnit = await this.mongoInterface.findOne('units', {_id: containerOwnerId } )



      if(!containingUnit)
       {
         console.log("WARN: null containingUnit for playerAddressHasAccessToContainer")
         return false
       }
        //     console.log("meep ", containingUnit)

      if(UnitHelper.unitIdsAreEqual( player.dockedInStation, containerOwnerId ) ){return true}
      if(UnitHelper.unitIdsAreEqual( player.possessedUnitId, containerOwnerId ) ){return true}

      //if the ship is docked in station, if the player owns it, and if the player is in the same station...
      if(containingUnit.dockedInStation && UnitHelper.playerOwnsUnit(player,containingUnit)  && UnitHelper.unitIdsAreEqual(containingUnit.dockedInStation, player.dockedInStation ) ){return true}

    }


    console.log('WARN: DOES NOT HAVE ACCESS', publicAddress, container)

    return false;
  }

  async getItemsWithinContainer( container )
  {
    //console.log('get items within ', container )
    let items = await this.mongoInterface.findAll('items', {containerId: container._id, escrowedForMarketOrder: null  } )
    //console.log('found', items)
    return items;
  }



}
